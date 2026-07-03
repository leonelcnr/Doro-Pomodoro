-- Reconciliación de historial de migraciones (2026-07-03).
--
-- Prod registró esta versión (20260702221710) además de la 20260702220144 con el
-- mismo nombre: la migración de seguridad `drop_refresh_token_from_metadata` quedó
-- aplicada DOS veces en prod bajo timestamps distintos (doble-apply del 2026-07-02),
-- pero solo existía el archivo local de la 220144. Eso dejaba una versión remota sin
-- archivo local, y la integración de GitHub de Supabase fallaba al pushear a `main`
-- con "Remote migration versions not found in local migrations directory".
--
-- Este archivo materializa esa versión huérfana para alinear local ↔ remoto. El SQL
-- es idéntico e idempotente (borra el token solo si existe), así que re-aplicarlo en
-- cualquier entorno es un no-op seguro. No cambia el estado de prod: allá ya está
-- registrada y aplicada.

update auth.users
set raw_user_meta_data = raw_user_meta_data - 'provider_refresh_token'
where raw_user_meta_data ? 'provider_refresh_token';
