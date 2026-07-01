-- =====================================================================
-- Migración: lectura de invitaciones por cualquier miembro de la sala
-- Fecha: 2026-06-25
--
-- Contexto: el endurecimiento de RLS (20260609000000) dejó el SELECT de
-- room_invites como "solo host" (policy invites_select_host). Resultado:
-- el diálogo "Compartir enlace" queda VACÍO para los miembros que no son
-- el host, porque obtenerInvitacion() no puede leer el código.
--
-- Decisión: cualquier MIEMBRO de la sala (host o member) puede LEER el
-- código de invitación para verlo/compartirlo. Coherente con el modelo
-- colaborativo y con rooms_select_member / tasks_select_member.
--
-- El INSERT sigue siendo solo del host (invites_insert_host): un miembro
-- común comparte el código existente pero no genera invitaciones nuevas.
-- =====================================================================

begin;

drop policy if exists invites_select_host on public.room_invites;

create policy invites_select_member on public.room_invites
  for select
  using (
    exists (
      select 1 from public.room_members m
      where m.room_id = room_invites.room_id and m.user_id = auth.uid()
    )
  );

commit;
