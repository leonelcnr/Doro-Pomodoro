-- Invitaciones sin tope de usos.
--
-- Al principio las invitaciones podían tener un tope de usos (max_uses), pero una
-- sala es algo espontáneo: el link se pasa por un grupo y entra quien quiera. Además
-- join_room sumaba un uso aunque ya fueras miembro, así que con tope se podía agotar
-- el link entrando dos veces.
--
--   * join_room deja de mirar max_uses y de contar usos. Sigue validando expires_at.
--   * create_room conserva p_max_uses en la firma (lo manda el frontend desplegado)
--     pero lo ignora: la invitación se crea siempre sin tope.
--   * Las invitaciones que ya tenían tope quedan sin él.
--
-- Las columnas max_uses y uses quedan en la tabla hasta que el frontend nuevo esté
-- desplegado (el anterior las lee); se borran en una migración posterior.

update public.room_invites set max_uses = null where max_uses is not null;

create or replace function public.join_room(p_code text)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_room_id uuid;
begin
  -- 1) Validar la invitación (solo que exista y no haya vencido)
  select room_id into v_room_id
  from public.room_invites
  where code = upper(p_code)
    and (expires_at is null or expires_at > now());

  if v_room_id is null then
    raise exception 'Invite inválido o expirado';
  end if;

  -- 2) Agregar miembro (idempotente)
  insert into public.room_members(room_id, user_id, role)
  values (v_room_id, auth.uid(), 'member')
  on conflict do nothing;

  -- 3) Devolver room_id para redireccionar
  return v_room_id;
end;
$$;

create or replace function public.create_room(
  p_name text,
  p_is_public boolean default false,
  p_max_uses integer default null::integer,
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
