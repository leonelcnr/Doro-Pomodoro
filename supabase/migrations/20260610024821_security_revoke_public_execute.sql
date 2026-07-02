-- El EXECUTE por defecto se concede a PUBLIC; revocarlo de anon no basta.
-- rls_auto_enable: event trigger interno, no debe ser invocable por la API.
revoke execute on function public.rls_auto_enable() from public;

-- update_room_sync: solo usuarios autenticados (valida membresía internamente).
revoke execute on function public.update_room_sync(uuid, jsonb, jsonb) from public;
grant  execute on function public.update_room_sync(uuid, jsonb, jsonb) to authenticated;
