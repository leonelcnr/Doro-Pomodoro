-- =====================================================================
-- create_room pierde p_max_uses (ver docs/pendientes.md, P1)
-- Fecha: 2026-10-15
--
-- APLICAR DESPUÉS de desplegar el frontend que ya no manda p_max_uses
-- (salasService.crearSala). Con el frontend anterior, PostgREST no encontraría
-- la función y no se podrían crear salas.
--
-- Cambiar la firma crea una función nueva, así que se borra la vieja y se
-- vuelven a dar los permisos que tenía.
-- =====================================================================

drop function public.create_room(text, boolean, integer, integer);

create function public.create_room(
  p_name text,
  p_is_public boolean default false,
  p_expires_minutes integer default null::integer
)
returns table(room_id uuid, invite_code text)
language plpgsql
security definer
set search_path to 'public'
as $BODY$
declare
  v_room_id uuid;
  v_code text;
  v_expires_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'El nombre de sala es muy corto';
  end if;

  -- Expiración opcional
  if p_expires_minutes is not null then
    v_expires_at := now() + make_interval(mins => p_expires_minutes);
  else
    v_expires_at := null;
  end if;

  -- 1) Crear sala
  insert into public.rooms (name, host_id, is_public)
  values (trim(p_name), auth.uid(), coalesce(p_is_public, false))
  returning id into v_room_id;

  -- 2) Agregar host como miembro
  insert into public.room_members (room_id, user_id, role)
  values (v_room_id, auth.uid(), 'host')
  on conflict do nothing;

  -- 3) Generar código y crear invite sin tope de usos (reintenta si colisiona)
  for i in 1..10 loop
    -- 8 chars hex (0-9A-F), simple y suficiente para MVP
    v_code := upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 8));

    begin
      insert into public.room_invites (code, room_id, created_by, expires_at)
      values (v_code, v_room_id, auth.uid(), v_expires_at);

      -- OK -> devolvemos
      room_id := v_room_id;
      invite_code := v_code;
      return next;

      return;
    exception
      when unique_violation then
        -- si el code ya existe, reintenta
        null;
    end;
  end loop;

  raise exception 'No se pudo generar un invite_code (muchas colisiones)';
end;
$BODY$;

revoke all on function public.create_room(text, boolean, integer) from public;
grant execute on function public.create_room(text, boolean, integer) to anon, authenticated, service_role;
