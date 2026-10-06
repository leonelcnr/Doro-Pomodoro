-- =====================================================================
-- Login · Fase C (ver docs/rediseno/login.md)
-- Fecha: 2026-10-06
--
-- Borra los usuarios anónimos sin actividad. Se cuenta como actividad que
-- alguna de sus sesiones se haya renovado: la app renueva el token cada vez
-- que alguien la abre. Sus filas caen por cascada.
--
-- Cuidado con las salas: borrar al host borra la sala (rooms.host_id es
-- on delete cascade). Si la sala tiene otros miembros, antes se le pasa el
-- host al que entró primero. Las salas sin nadie más se van con él.
--
-- Corre todos los días a las 04:30 UTC con pg_cron.
-- =====================================================================

create extension if not exists pg_cron with schema pg_catalog;

create function public.borrar_anonimos_inactivos(p_dias integer default 30)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids    uuid[];
  v_limite timestamptz := now() - make_interval(days => p_dias);
begin
  select coalesce(array_agg(u.id), '{}') into v_ids
  from auth.users u
  where u.is_anonymous
    and u.created_at < v_limite
    and not exists (
      select 1 from auth.sessions s
      where s.user_id = u.id
        and coalesce(s.refreshed_at, s.updated_at, s.created_at) > v_limite
    );

  if cardinality(v_ids) = 0 then
    return 0;
  end if;

  -- Salas que hostean y que usa alguien más: el host pasa al que entró primero
  with nuevos as (
    select distinct on (r.id) r.id as sala, m.user_id as host
    from public.rooms r
    join public.room_members m on m.room_id = r.id and m.user_id <> all (v_ids)
    where r.host_id = any (v_ids)
    order by r.id, m.joined_at
  ), salas as (
    update public.rooms r set host_id = n.host
    from nuevos n where r.id = n.sala
    returning r.id, r.host_id
  )
  update public.room_members m set role = 'host'
  from salas s where m.room_id = s.id and m.user_id = s.host_id;

  delete from auth.users where id = any (v_ids);
  return cardinality(v_ids);
end $$;

revoke all on function public.borrar_anonimos_inactivos(integer) from public, anon, authenticated;
grant execute on function public.borrar_anonimos_inactivos(integer) to service_role;

select cron.schedule(
  'borrar-anonimos-inactivos',
  '30 4 * * *',
  $$select public.borrar_anonimos_inactivos(30)$$
);
