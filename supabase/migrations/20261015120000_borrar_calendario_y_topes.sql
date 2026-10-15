-- =====================================================================
-- Limpieza después del deploy del rediseño (ver docs/pendientes.md, P1)
-- Fecha: 2026-10-15
--
--   * Se borra `calendar_events`: la pantalla de Calendario ya no existe y sus
--     eventos se descartan, no se migran (decisión de Leo, ver
--     docs/rediseno/tareas-datos.md). Antes, fusionar_anonimo deja de tocarla.
--   * Se borran `room_invites.max_uses` y `room_invites.uses`: join_room dejó de
--     mirarlas en 20261007003452 y el frontend desplegado no las lee.
--
-- create_room todavía recibe p_max_uses (el frontend desplegado lo manda); sale
-- en 20261015130000, que va después de desplegar el frontend que ya no lo manda.
-- =====================================================================

-- 1. fusionar_anonimo sin calendar_events (misma firma: los permisos se conservan)
create or replace function public.fusionar_anonimo(p_anonimo uuid, p_cuenta uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_desplazamiento integer;
  v_ultimo         date;
  v_racha          integer;
begin
  if p_anonimo = p_cuenta then
    raise exception 'El anónimo y la cuenta son el mismo usuario';
  end if;
  if not exists (select 1 from auth.users where id = p_anonimo and is_anonymous) then
    raise exception 'El usuario de origen no es anónimo';
  end if;
  if not exists (select 1 from auth.users where id = p_cuenta and not is_anonymous) then
    raise exception 'La cuenta de destino no existe o es anónima';
  end if;

  -- 1. Temas: los que la cuenta no tiene se copian al final de su lista
  select coalesce(max(position) + 1, 0) into v_desplazamiento
  from public.topics where user_id = p_cuenta;

  insert into public.topics (user_id, name, icon, position)
  select p_cuenta, a.name, a.icon, a.position + v_desplazamiento
  from public.topics a
  where a.user_id = p_anonimo
    and not exists (
      select 1 from public.topics c
      where c.user_id = p_cuenta and lower(trim(c.name)) = lower(trim(a.name))
    );

  -- 2. Tareas: dueño y tema en el mismo update (la FK compuesta pide que el
  --    tema sea del dueño de la tarea)
  update public.tasks t
  set user_id  = p_cuenta,
      topic_id = (
        select c.id
        from public.topics a
        join public.topics c
          on c.user_id = p_cuenta and lower(trim(c.name)) = lower(trim(a.name))
        where a.id = t.topic_id
      )
  where t.user_id = p_anonimo;

  delete from public.topics where user_id = p_anonimo;

  -- 3. Sesiones de estudio
  update public.study_sessions set user_id = p_cuenta where user_id = p_anonimo;

  -- 4. Salas
  insert into public.room_members (room_id, user_id, role)
  select room_id, p_cuenta, role from public.room_members where user_id = p_anonimo
  on conflict (room_id, user_id) do update
    set role = case when excluded.role = 'host' then 'host' else public.room_members.role end;
  delete from public.room_members where user_id = p_anonimo;

  update public.rooms        set host_id    = p_cuenta where host_id    = p_anonimo;
  update public.room_invites set created_by = p_cuenta where created_by = p_anonimo;

  -- 5. Estadísticas. La racha sale de los días con sesiones (ya juntos): el
  --    tramo de días seguidos que termina en el último día de estudio.
  select max(dia) into v_ultimo
  from (select (created_at at time zone 'utc')::date as dia
        from public.study_sessions where user_id = p_cuenta) d;

  with dias as (
    select distinct (created_at at time zone 'utc')::date as dia
    from public.study_sessions where user_id = p_cuenta
  ), tramos as (
    select dia, dia - (row_number() over (order by dia))::integer as tramo from dias
  )
  select count(*) into v_racha
  from tramos
  where tramo = (select tramo from tramos where dia = v_ultimo);

  insert into public.user_stats (user_id, current_streak, longest_streak, last_study_date, total_study_minutes)
  select p_cuenta,
         coalesce(v_racha, 0),
         greatest(coalesce(max(longest_streak), 0), coalesce(v_racha, 0)),
         greatest(max(last_study_date), v_ultimo),
         coalesce(sum(total_study_minutes), 0)
  from public.user_stats
  where user_id in (p_anonimo, p_cuenta)
  having count(*) > 0
  on conflict (user_id) do update
    set current_streak      = excluded.current_streak,
        longest_streak      = excluded.longest_streak,
        last_study_date     = excluded.last_study_date,
        total_study_minutes = excluded.total_study_minutes;

  delete from public.user_stats where user_id = p_anonimo;
end $$;


-- 2. El calendario viejo
drop table public.calendar_events;

-- 3. Topes de usos de las invitaciones
alter table public.room_invites
  drop column max_uses,
  drop column uses;
