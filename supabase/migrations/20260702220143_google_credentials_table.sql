-- Mueve el `provider_refresh_token` de Google fuera de `user_metadata` (legible por
-- el cliente vía JWT) a una tabla protegida que solo el `service_role` puede tocar.
-- Ver docs/tareas-pendientes.md P1 y supabase/SECURITY_FIXES_PLAN.md (informe §1.1).

-- 1) Tabla de credenciales. Una fila por usuario con su refresh token de Google.
create table if not exists public.google_credentials (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  refresh_token text not null,
  updated_at    timestamptz not null default now()
);

-- 2) RLS deny-all: al habilitar RLS sin ninguna policy, `anon` y `authenticated`
--    no pueden leer ni escribir. Solo el `service_role` (que bypassa RLS) accede,
--    desde la edge function `save-google-token` y `sync-calendar`.
alter table public.google_credentials enable row level security;
revoke all on public.google_credentials from anon, authenticated;

-- 3) Backfill: copiamos los tokens que hoy viven en `user_metadata` para no cortarle
--    el calendario a nadie ya conectado. La limpieza de `user_metadata` va en una
--    migración posterior, recién después de verificar que todo lee de esta tabla.
insert into public.google_credentials (user_id, refresh_token)
select id, raw_user_meta_data->>'provider_refresh_token'
from auth.users
where raw_user_meta_data->>'provider_refresh_token' is not null
on conflict (user_id) do update
  set refresh_token = excluded.refresh_token,
      updated_at    = now();
