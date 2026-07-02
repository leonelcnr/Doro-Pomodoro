-- =====================================================================
-- Migración: Endurecimiento de RLS y funciones (auditoría de seguridad)
-- Fecha: 2026-06-09
--
-- Corrige vulnerabilidades confirmadas en la auditoría:
--   C1  rooms UPDATE abierto a cualquier usuario autenticado
--   C2  rooms SELECT abierto a cualquier usuario autenticado
--   C3  tasks SELECT expone las tareas de TODAS las salas
--   C4  IDOR en get_dashboard_aggregates / get_study_stats
--   +   tasks sin WITH CHECK; search_path mutable; rls_auto_enable público
--
-- Modelo de membresía: se valida contra public.room_members.
-- Decisión de diseño: CUALQUIER miembro de la sala puede sincronizar
-- timer_state y music_state (vía RPC update_room_sync). El resto de
-- columnas de rooms (host_id, name, is_public) solo las controla el host.
--
-- NOTA: revisar en staging antes de aplicar a producción.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1) ROOMS  (C1 + C2)
--    Eliminar las policies viejas inseguras que anulan a las correctas.
-- ---------------------------------------------------------------------
drop policy if exists "Permitir lectura de rooms"        on public.rooms; -- C2: SELECT abierto
drop policy if exists "Miembros pueden actualizar rooms" on public.rooms; -- C1: UPDATE abierto

-- Lectura: host o miembro de la sala (además de las públicas).
drop policy if exists rooms_select_public_or_host on public.rooms;
create policy rooms_select_member on public.rooms
  for select
  using (
    is_public
    or host_id = auth.uid()
    or exists (
      select 1 from public.room_members m
      where m.room_id = rooms.id and m.user_id = auth.uid()
    )
  );

-- UPDATE directo de rooms queda SOLO para el host (rooms_update_host ya existe).
-- La sincronización de timer/música por miembros NO usa UPDATE directo:
-- se hace mediante la función SECURITY DEFINER update_room_sync (abajo),
-- que solo puede tocar timer_state y music_state.

-- ---------------------------------------------------------------------
-- 2) RPC update_room_sync  (sincronización de timer/música por miembros)
-- ---------------------------------------------------------------------
create or replace function public.update_room_sync(
  p_room_id     uuid,
  p_timer_state jsonb default null,
  p_music_state jsonb default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  -- Solo miembros (host o member) de la sala pueden sincronizar.
  if not exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = auth.uid()
  ) then
    raise exception 'No sos miembro de esta sala';
  end if;

  -- coalesce: actualiza solo el estado provisto, conserva el otro.
  update public.rooms
  set timer_state = coalesce(p_timer_state, timer_state),
      music_state = coalesce(p_music_state, music_state)
  where id = p_room_id;
end;
$$;

-- El EXECUTE por defecto se concede a PUBLIC; hay que revocarlo de PUBLIC (no solo de anon).
revoke execute on function public.update_room_sync(uuid, jsonb, jsonb) from public;
grant  execute on function public.update_room_sync(uuid, jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------------
-- 3) TASKS  (C3 + WITH CHECK + INSERT con membresía)
--    Tareas personales (room_id IS NULL): solo el dueño.
--    Tareas de sala (room_id IS NOT NULL): cualquier miembro de esa sala
--    (modelo colaborativo, coherente con la UI).
-- ---------------------------------------------------------------------

-- SELECT
drop policy if exists "Ver tareas permitidas" on public.tasks;
create policy tasks_select_member on public.tasks
  for select
  using (
    (room_id is null and user_id = auth.uid())
    or (room_id is not null and exists (
      select 1 from public.room_members m
      where m.room_id = tasks.room_id and m.user_id = auth.uid()
    ))
  );

-- INSERT (debe ser dueño y, si es de sala, miembro de la sala)
drop policy if exists "Insertar tareas propias" on public.tasks;
create policy tasks_insert_member on public.tasks
  for insert
  with check (
    user_id = auth.uid()
    and (
      room_id is null
      or exists (
        select 1 from public.room_members m
        where m.room_id = tasks.room_id and m.user_id = auth.uid()
      )
    )
  );

-- UPDATE (puede editar tareas propias o de salas de las que es miembro;
--         WITH CHECK impide reasignar a salas ajenas o robar a personal)
drop policy if exists "Actualizar tareas permitidas" on public.tasks;
create policy tasks_update_member on public.tasks
  for update
  using (
    (room_id is null and user_id = auth.uid())
    or (room_id is not null and exists (
      select 1 from public.room_members m
      where m.room_id = tasks.room_id and m.user_id = auth.uid()
    ))
  )
  with check (
    (room_id is null and user_id = auth.uid())
    or (room_id is not null and exists (
      select 1 from public.room_members m
      where m.room_id = tasks.room_id and m.user_id = auth.uid()
    ))
  );

-- DELETE (mismo criterio que UPDATE)
drop policy if exists "Borrar tareas permitidas" on public.tasks;
create policy tasks_delete_member on public.tasks
  for delete
  using (
    (room_id is null and user_id = auth.uid())
    or (room_id is not null and exists (
      select 1 from public.room_members m
      where m.room_id = tasks.room_id and m.user_id = auth.uid()
    ))
  );

-- ---------------------------------------------------------------------
-- 4) IDOR en funciones de estadísticas  (C4)
--    Validar que p_user_id coincide con el usuario autenticado.
-- ---------------------------------------------------------------------
create or replace function public.get_dashboard_aggregates(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
    v_daily json;
    v_hourly json;
    v_tasks json;
begin
    -- C4: impedir leer estadísticas de otros usuarios
    if p_user_id is distinct from auth.uid() then
        raise exception 'No autorizado';
    end if;

    select json_agg(t) into v_daily
    from (
        select
            (created_at at time zone 'America/Argentina/Buenos_Aires')::date as stat_date,
            extract(isodow from (created_at at time zone 'America/Argentina/Buenos_Aires'))::integer as day_of_week,
            sum(duration_minutes) as total_minutes,
            count(*) as sessions_count
        from study_sessions
        where user_id = p_user_id
        group by 1, 2
        order by 1 asc
    ) t;

    select json_agg(t) into v_hourly
    from (
        select
            (created_at at time zone 'America/Argentina/Buenos_Aires')::date as stat_date,
            extract(hour from (created_at at time zone 'America/Argentina/Buenos_Aires'))::integer as stat_hour,
            sum(duration_minutes) as total_minutes
        from study_sessions
        where user_id = p_user_id and created_at >= (now() - interval '7 days')
        group by 1, 2
        order by 1 asc, 2 asc
    ) t;

    select json_agg(t) into v_tasks
    from (
        select
            (created_at at time zone 'America/Argentina/Buenos_Aires')::date as stat_date,
            coalesce(type, 'Otro') as task_type,
            count(*) as tasks_count
        from tasks
        where user_id = p_user_id and status = 'Completada'
        group by 1, 2
        order by 1 asc
    ) t;

    return json_build_object(
        'daily',  coalesce(v_daily, '[]'::json),
        'hourly', coalesce(v_hourly, '[]'::json),
        'tasks',  coalesce(v_tasks, '[]'::json)
    );
end;
$function$;

create or replace function public.get_study_stats(
    p_user_id uuid,
    p_period text,
    p_start_date timestamptz default null,
    p_end_date timestamptz default null
)
returns table(period_start timestamptz, total_minutes bigint)
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
    -- C4: impedir leer estadísticas de otros usuarios
    if p_user_id is distinct from auth.uid() then
        raise exception 'No autorizado';
    end if;

    return query
    select
        date_trunc(p_period, created_at) as period_start,
        coalesce(sum(duration_minutes)::bigint, 0) as total_minutes
    from study_sessions
    where user_id = p_user_id
      and (p_start_date is null or created_at >= p_start_date)
      and (p_end_date   is null or created_at <= p_end_date)
    group by period_start
    order by period_start asc;
end;
$function$;

-- ---------------------------------------------------------------------
-- 5) Menores del security advisor
-- ---------------------------------------------------------------------
-- search_path inmutable en las trigger functions restantes.
alter function public.set_updated_at()                 set search_path = 'public';
alter function public.update_user_stats_after_session() set search_path = 'public';

-- rls_auto_enable es un event trigger interno: no debe ser invocable por la API.
-- (revocar de PUBLIC, no solo de anon/authenticated, que heredan el grant por defecto)
revoke execute on function public.rls_auto_enable() from public;

commit;
