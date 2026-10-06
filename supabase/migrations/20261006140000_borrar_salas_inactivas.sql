-- =====================================================================
-- Salas descartables (decisión de Leo, 2026-10-06; ver docs/rediseno/login.md)
--
-- Las salas se usan y se abandonan: es raro volver a una cuando todos se
-- fueron. Se borran a los 30 días sin actividad, con sus membresías,
-- invitaciones y tareas de sala (cascada). Las sesiones de estudio no
-- dependen de la sala: los minutos y la racha no se tocan.
--
-- Cuenta como actividad:
--   * abrir la sala (join_room_by_id, que corre en cada entrada; unirse por
--     código termina ahí también),
--   * cambiar el reloj o la música compartidos (trigger en rooms),
--   * crear, editar o borrar una tarea de la sala (trigger en tasks).
--
-- Corre todos los días a las 04:35 UTC con pg_cron, después de la limpieza
-- de anónimos.
-- =====================================================================

-- 1. Última actividad, con el mejor dato que hay para las salas existentes
alter table public.rooms add column last_activity_at timestamptz not null default now();

update public.rooms r
set last_activity_at = greatest(
  r.created_at,
  (r.timer_state ->> 'actualizadoEn')::timestamptz,
  (select max(m.joined_at)  from public.room_members m where m.room_id = r.id),
  (select max(t.created_at) from public.tasks t        where t.room_id = r.id)
);

create index rooms_ultima_actividad on public.rooms (last_activity_at);

-- 2. Reloj o música compartidos
create function public.sala_activa_por_sincronizacion() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.last_activity_at := now();
  return new;
end $$;

create trigger rooms_actividad_sincronizacion
  before update of timer_state, music_state on public.rooms
  for each row execute function public.sala_activa_por_sincronizacion();

-- 3. Tareas de la sala
create function public.sala_activa_por_tarea() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_sala uuid := case when tg_op = 'DELETE' then old.room_id else new.room_id end;
begin
  if v_sala is not null then
    update public.rooms set last_activity_at = now() where id = v_sala;
  end if;
  return null;
end $$;

create trigger tasks_actividad_sala
  after insert or update or delete on public.tasks
  for each row execute function public.sala_activa_por_tarea();

revoke all on function public.sala_activa_por_sincronizacion() from public, anon, authenticated;
revoke all on function public.sala_activa_por_tarea()          from public, anon, authenticated;

-- 4. Abrir la sala. Igual que 20260610041526, más la marca de actividad
--    (volver a una sala de la que ya se es miembro no inserta nada).
create or replace function public.join_room_by_id(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  -- Validar que la sala exista y marcarla activa en el mismo paso
  update public.rooms set last_activity_at = now() where id = p_room_id;
  if not found then
    raise exception 'La sala no existe';
  end if;

  -- Alta idempotente. on conflict sobre la PK (room_id, user_id) no
  -- vuelve a insertar ni degrada el rol de un host ya existente.
  insert into public.room_members (room_id, user_id, role)
  values (p_room_id, auth.uid(), 'member')
  on conflict (room_id, user_id) do nothing;
end;
$$;

-- 5. Limpieza
create function public.borrar_salas_inactivas(p_dias integer default 30)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_borradas integer;
begin
  delete from public.rooms
  where last_activity_at < now() - make_interval(days => p_dias);
  get diagnostics v_borradas = row_count;
  return v_borradas;
end $$;

revoke all on function public.borrar_salas_inactivas(integer) from public, anon, authenticated;
grant execute on function public.borrar_salas_inactivas(integer) to service_role;

select cron.schedule(
  'borrar-salas-inactivas',
  '35 4 * * *',
  $$select public.borrar_salas_inactivas(30)$$
);
