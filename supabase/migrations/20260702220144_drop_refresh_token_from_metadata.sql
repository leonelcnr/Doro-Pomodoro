-- ⚠️ APLICAR AL FINAL, solo después de verificar que:
--   1) `google_credentials` está poblada (backfill de 20260702120000).
--   2) `sync-calendar` (deployado) lee el token desde `google_credentials`.
--   3) El cliente (deployado) persiste el token vía la edge function `save-google-token`.
--   4) Una cuenta real reconectó Google y sincronizó un evento OK.
--
-- Recién entonces se borra el `provider_refresh_token` de `user_metadata`, cerrando
-- el hueco de que un refresh token de larga vida quede legible desde el cliente.

update auth.users
set raw_user_meta_data = raw_user_meta_data - 'provider_refresh_token'
where raw_user_meta_data ? 'provider_refresh_token';
