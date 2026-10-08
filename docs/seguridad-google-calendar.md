# Google Calendar · cómo se guardan los tokens y por qué pide reconectar

Revisión del 2026-10-04, antes de conectar Tareas con Google Calendar (Fase C de
`docs/rediseno/tareas-datos.md`). Se leyó la base de producción, solo con consultas de
lectura, junto con las edge functions desplegadas y el código del cliente. No se cambió nada.

## Cómo funciona hoy

1. **Conectar.** «Conectar Google Calendar» (`authHelpers.conectarGoogleCalendar`) relanza el
   login de Google con el scope `calendar`, `access_type=offline` y `prompt=consent`. A las
   cuentas de Discord o anónimas les vincula una identidad de Google (`linkIdentity`).
2. **Guardar.** Al volver, `onAuthStateChange` llama a `persistirRefreshToken`. Si la sesión trae
   `provider_refresh_token`, el cliente se lo manda a la edge function `save-google-token`,
   que lo guarda en `public.google_credentials`.
3. **Sincronizar.** `sync-calendar` lee el refresh token, pide un access token a Google y crea,
   edita o borra el evento.

## Estado de la base (2026-10-04)

| Qué | Valor |
|---|---|
| Filas en `google_credentials` | **1**, del 2026-07-02 (la copia que hizo la migración) |
| Refresh tokens que siguen en `user_metadata` | 0 (la limpieza de julio funcionó) |
| Permisos de `anon` / `authenticated` sobre la tabla | ninguno (RLS sin políticas + `revoke`) |
| Identidades de Google | 22. Hubo 3 logins con Google después de julio, todos normales (sin el scope de Calendar) |
| Advertencias de Supabase sobre la tabla | `rls_enabled_no_policy` (INFO): es a propósito, pero conviene sacarla de `public` |

La advertencia que viste en Supabase seguramente era la anterior: el refresh token vivía en
`user_metadata`, que viaja dentro del JWT y se puede leer desde el navegador. Eso se arregló
el 2026-07-02 y hoy no queda ninguno ahí.

## Por qué pide reconectar seguido

1. **La UI decide «conectado» con un dato que caduca. Es la causa principal.**
   `CalendarPage.tsx:47` usa `!!user?.provider_token`, el access token de Google de la sesión.
   Supabase solo lo incluye en la sesión que vuelve del OAuth. Cuando renueva la sesión
   (≈ 1 h), ya no viene, y la pantalla vuelve a ofrecer «Conectar» aunque el refresh token
   siga guardado en el servidor. La reconexión no hacía falta: la pedía la UI.
2. **Si la app de Google está en modo «Testing», los refresh tokens vencen a los 7 días.**
   Es lo que pasa con cualquier pantalla de consentimiento en *Testing* que pide scopes
   sensibles, como `calendar`: Google revoca el token a la semana y `sync-calendar` falla con
   `invalid_grant`. Hay que revisarlo en Google Cloud Console → *APIs & Services → OAuth consent
   screen → Publishing status*. Desde acá no se puede ver.
3. **Los errores no distinguen «hay que reconectar» de un fallo cualquiera.** `sync-calendar`
   responde 500 a todo, y el cliente (`useCalendarEvents.ts`) se los traga en silencio: el
   evento queda en Doro sin llegar a Google y nadie se entera.
4. **Reconectar pisa la sesión de Doro.** «Conectar» hace un login completo de nuevo (o un
   `linkIdentity`). Con Discord o anónimos puede chocar con `identity_already_exists` y deja al
   usuario en otra cuenta.

## Riesgos de seguridad que quedan

| Riesgo | Gravedad | Detalle |
|---|---|---|
| El refresh token pasa por el navegador | Media | Llega al cliente en la sesión de Supabase, que se guarda en `localStorage` hasta la próxima renovación, y el cliente lo reenvía. Un XSS en esa ventana se lo lleva. |
| Guardado en texto plano | Media | Cualquier backup, volcado o acceso con la service role lo ve tal cual. |
| Vive en el esquema `public` | Baja | Hoy nadie tiene permisos, pero está en el esquema que expone la API. Un `grant` por error lo publica. |
| Scope `calendar` completo | Baja | Da acceso a todos los calendarios y su configuración. Alcanza con `calendar.events`. |
| `provider_token` en el estado de React | Baja | `mapearUsuario` copia el access token de Google a `Usuario`, que circula por toda la app. |
| CORS en `*` si falta `ALLOWED_ORIGINS` | Baja | Las funciones caen en `*` si el secreto no está configurado. Verificar que esté. |
| El fallback a `identity_data` en `sync-calendar` | Ninguna | Hoy no hay datos ahí (0 filas). Es código muerto. |

## La forma correcta

**Que el refresh token no toque nunca el navegador y quede cifrado en un esquema privado.**

1. **Un OAuth propio para Calendar, del lado del servidor**, separado del login de Doro:
   - `google-calendar-conectar` (edge function, con el JWT del usuario) arma la URL de Google:
     `access_type=offline`, `prompt=consent`, `include_granted_scopes=true`, scope
     `calendar.events` y un `state` firmado (HMAC) con el id del usuario y un vencimiento.
   - Google redirige a `google-calendar-callback` (edge function pública, `verify_jwt = false`).
     Esa función valida el `state`, cambia el `code` por los tokens con el client secret, cifra
     el refresh token y lo guarda. Después vuelve a `/tareas?calendar=conectado`.
   - El login de Doro queda igual. Se borran `conectarGoogleCalendar` (el relogin) y
     `persistirRefreshToken`.
2. **Cifrado en la aplicación**, con AES-256-GCM (WebCrypto en Deno). La clave vive en un
   secreto de las funciones (`GOOGLE_TOKEN_KEY`), nunca en la base: un volcado no alcanza para
   usar los tokens. *(Alternativa: Supabase Vault. Para un secreto por usuario es más
   engorroso.)*
3. **Esquema `private`**, que la API no expone:

   ```sql
   create schema if not exists private;
   revoke all on schema private from public, anon, authenticated;

   create table private.google_calendar (
     user_id          uuid primary key references auth.users (id) on delete cascade,
     token_cifrado    bytea not null,          -- AES-GCM
     iv               bytea not null,          -- 12 bytes, uno nuevo por cada guardado
     scope            text  not null,
     estado           text  not null default 'conectado'
                      check (estado in ('conectado', 'reconectar')),
     conectado_en     timestamptz not null default now(),
     ultimo_error     text,
     ultimo_error_en  timestamptz
   );

   -- La UI pregunta el estado, nunca el token
   create function public.estado_google_calendar() returns text
   language sql stable security definer set search_path = '' as $$
     select coalesce(
       (select estado from private.google_calendar where user_id = auth.uid()),
       'desconectado');
   $$;
   revoke execute on function public.estado_google_calendar() from public, anon;
   grant execute on function public.estado_google_calendar() to authenticated;
   ```

4. **Errores que dicen qué pasó.** Si Google responde `invalid_grant`, `sync-calendar` marca
   `estado = 'reconectar'`, guarda el error y responde `409 { codigo: "RECONECTAR" }`. Solo en
   ese caso la UI ofrece reconectar. Los otros errores muestran un aviso y se reintentan.
5. **Desconectar de verdad.** Hace un `POST https://oauth2.googleapis.com/revoke` y borra la fila.
6. **En Google Cloud:** pasar la pantalla de consentimiento a *In production*. Para el scope
   sensible, Google va a pedir verificación (política de privacidad, dominio verificado y un
   video del uso). Mientras no esté verificada, se ve el aviso «app no verificada» y el límite
   es de 100 usuarios, pero los tokens dejan de vencer a los 7 días.

## Cómo llegar ahí (en orden)

1. **Ahora, sin código:** revisar el *Publishing status* en Google Cloud. Si dice *Testing*,
   eso solo explica los vencimientos semanales.
2. **Arreglo chico, inmediato:** que la UI no use `provider_token` para saber si está
   conectado. Se puede usar la función `estado_google_calendar()`, aunque todavía lea de la
   tabla actual. Sacar `provider_token` de `Usuario`.
3. **Migración:** crear `private.google_calendar`, la función de estado y el secreto
   `GOOGLE_TOKEN_KEY`. Desplegar las dos funciones nuevas del OAuth y actualizar
   `sync-calendar` (lectura cifrada, 409 en `invalid_grant`, sin fallback a `identity_data`).
4. **Pasar la única credencial actual:** cifrarla con un script de una vez que corra en una edge
   function. Otra opción es pedirle a esa cuenta que reconecte. Después,
   `drop table public.google_credentials;` y borrar `save-google-token`.
5. **Recién entonces**, la Fase C de Tareas: sincronizar parciales, prácticos e informes con
   fecha desde `tasks`.

Aparte de Google, el asesor de Supabase marca otras cosas que conviene atender:
- Funciones `SECURITY DEFINER` ejecutables por `anon`: `create_room`,
  `get_dashboard_aggregates`, `get_study_stats`, `join_room` y `join_room_by_id`.
- La protección contra contraseñas filtradas está apagada.
