-- =====================================================================
-- Migración: auto-unión permisiva a la sala por room_id
-- Fecha: 2026-06-10
--
-- Contexto: el endurecimiento de RLS (20260609000000) hizo que leer la
-- sala y sincronizar timer/música exijan ser miembro en room_members.
-- Pero solo join_room (por código de invitación) crea esa membresía, y
-- la ruta /room/:roomId no pasa por ahí. Resultado: quien llega a la
-- sala por el link directo /room/<id> queda "presente" (Realtime) pero
-- sin fila en room_members, y update_room_sync le falla.
--
-- Decisión (variante permisiva, app de estudio): cualquiera con el
-- room_id (el "link") puede unirse. El UUID de la sala actúa como
-- secreto. La membresía es persistente: una vez dentro, sigue siéndolo.
-- =====================================================================

begin;

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

  -- Validar que la sala exista (evita membresías huérfanas).
  -- SECURITY DEFINER: este select ve la sala aunque el llamante todavía
  -- no sea miembro, que es justo lo que necesitamos antes de unirlo.
  if not exists (select 1 from public.rooms where id = p_room_id) then
    raise exception 'La sala no existe';
  end if;

  -- Alta idempotente. on conflict sobre la PK (room_id, user_id) no
  -- vuelve a insertar ni degrada el rol de un host ya existente.
  insert into public.room_members (room_id, user_id, role)
  values (p_room_id, auth.uid(), 'member')
  on conflict (room_id, user_id) do nothing;
end;
$$;

-- El EXECUTE por defecto se concede a PUBLIC; revocarlo y dárselo solo
-- a usuarios autenticados (coherente con join_room / update_room_sync).
revoke execute on function public.join_room_by_id(uuid) from public;
grant  execute on function public.join_room_by_id(uuid) to authenticated;

commit;
