# Rediseño · Login

Pantalla `/login` (y `/registro`, que hoy es la misma). Parte de la Fase 1 de
`docs/plan-rediseno.md`, que tiene las reglas generales, el formato de los bocetos y las
decisiones transversales.

**Archivos de esta pantalla** (los toca solo la sesión que trabaja en ella):
`docs/rediseno/login.md` y `bocetos/login.html`.

Al commitear, nombrar las rutas, nunca `git add .`: puede haber otras sesiones trabajando en
paralelo. Del plan general solo se toca la fila de esta pantalla en la tabla.

---

Boceto: https://claude.ai/artifact/NqvYrc4ig5xd7HjHfzJt23 · fuente `bocetos/login.html`.

## El cambio de Leo (2026-10-06)

**Quien entra a Doro cae directo en el home como anónimo.** Si quiere crearse una cuenta o
iniciar sesión, lo hace desde el home y eso lo lleva a la página de login. Es la barrera de
entrada más grande que tiene hoy la app: para usar cualquier cosa hay que pasar por el login.

## Cómo está hoy (leído del código, 2026-10-06)

- `AuthContext.tsx`: cuando no hay sesión, `onAuthStateChange` manda a `/login`. No hay
  guardas por ruta: esa es la única barrera.
- El login (`login-form.tsx`) ofrece «Continuar como Anónimo» (`signInAnonymously`) y
  Google, GitHub y Discord (`signInWithOAuth`). `/registro` muestra el mismo formulario.
- Ya existe `linkAccount` (`linkIdentity`) y el menú de la cuenta tiene «Vincular cuenta
  (Guardar progreso)» para el anónimo. `mostrarErrorOAuthDesdeUrl` ya atrapa
  `identity_already_exists`.
- **Bug que se pierde datos hoy:** en el menú de la cuenta, «Iniciar sesión» del anónimo
  llama a `signOut`. La sesión anónima se cierra, se manda a `/login`, y lo que hizo ese
  anónimo queda huérfano: al entrar con una cuenta, es otro usuario.
- `InvitacionPage` manda a `/login?redirect=…` si no hay sesión.
- Las políticas de RLS no distinguen anónimos (ya funcionan con ellos).

## ¿Cuánta reestructuración es?

Poca para lo central. Lo difícil es fusionar datos y el cuidado de la base, y eso se puede
hacer en fases.

**Fase A · el anónimo es la entrada (chica, unas horas).**
1. `AuthContext`: sin sesión, crear la anónima (una sola vez, aunque `StrictMode` monte el
   efecto dos veces) en vez de navegar a `/login`. Al cerrar sesión una cuenta real, se
   vuelve a anónimo.
2. Menú de la cuenta: «Iniciar sesión» lleva a `/login`; no cierra la sesión.
3. Login: si el usuario es anónimo, cada proveedor hace `linkIdentity` (el anónimo pasa a
   ser esa cuenta y no se pierde nada). Si vuelve con `identity_already_exists`, la cuenta
   ya existía: se entra con `signInWithOAuth`. Se respeta `?redirect=`.
4. `/registro` redirige a `/login`. `InvitacionPage` ya no necesita la rama sin sesión.
5. Revisar que en Supabase estén activos el inicio anónimo y la vinculación manual de
   identidades (la vinculación se usa hoy, así que debería estarlo).

**Fase B · sumar lo del anónimo a una cuenta que ya existía (mediana).** Cuando la cuenta
ya existía, lo que hizo el anónimo queda en otro usuario. Una edge function con la service
role reasigna sus filas (`tasks`, `study_sessions`, `topics`, `room_members`; `user_stats`
se combina) del id anónimo al real. El cliente guarda el id anónimo antes del OAuth y lo
manda al volver. Hasta tenerla, el texto del login no puede prometer «sumamos lo de hoy».

**Fase C · cuidado de la base y SEO.**
- Borrar anónimos sin actividad (por ejemplo, más de 30 días) con un cron.
- Que los bots no creen un anónimo por visita: no crear la sesión hasta la primera acción,
  o Turnstile. Supabase limita los inicios anónimos por IP, pero un crawler igual suma
  usuarios.
- Una página pública, prerenderizada, para que Google indexe algo antes de la app.

## Primera ronda (publicada 2026-10-06, esperando opinión)

Cada maqueta arranca en el home D4 como anónimo; «Entrar» (con el ícono de persona) lleva
al login y elegir un proveedor vuelve al home con la cuenta. Ajustes nuevos: **Llega** (con
progreso / recién llegado) e **Invitación** (solo arriba / también bajo el anillo).
- **1 · Una sola puerta** (recomendada). «Guardá lo que hiciste», una línea con lo que se
  guarda y un botón por proveedor. No hay crear ni entrar: el sistema decide (vincula si la
  cuenta es nueva, entra si ya existía).
- **2 · Crear cuenta o entrar.** Lo mismo con dos pestañas arriba; cambian título y nota.
- **3 · El anillo de lado.** El anillo del home con lo que hiciste a la izquierda, los
  proveedores a la derecha. Recién llegado, el anillo queda vacío.
- **4 · Hoja desde abajo.** El login sube sobre el home, como la bandeja, y el home queda
  atenuado (sin desenfoque).

## Diseño final (aprobado por Leo, 2026-10-06)

**1 · Una sola puerta.** Fuente: `bocetos/login.html` (opción 1).
- Se llega desde el home: «Entrar» con el ícono de persona en la barra (se desvanece con
  ella; el ícono queda) y, si se elige, la línea bajo el anillo.
- Arriba a la izquierda, «Seguir sin cuenta» vuelve al home.
- Columna centrada de 380 px: el logo, el título que dice para qué es la cuenta, una línea
  con lo que se guarda y un botón por proveedor («Seguir con Google / GitHub / Discord»).
- No hay «crear cuenta» ni «iniciar sesión»: si la cuenta es nueva se vincula al anónimo, y
  si ya existía se entra a ella.
- Textos: con progreso, «Guardá lo que hiciste» y lo hecho en negrita; recién llegado, «Tu
  cuenta de Doro». La nota «sumamos lo de hoy» solo va cuando exista la Fase B; antes, la
  nota dice únicamente «¿Ya tenés cuenta? Entrá con la misma».
- Al volver, el home muestra un aviso («Listo: lo que hiciste quedó en tu cuenta de
  Google») y el avatar con la inicial.

## ¿Anónimo en Supabase o todo en `localStorage`? (pregunta de Leo, 2026-10-06)

Idea de Leo: que el anónimo guarde todo en `localStorage` y que recién al crear la cuenta
se empiece a guardar en la base.

- **Lo que gana:** no hay usuarios anónimos en la base (ni basura ni bots), y pasar lo hecho
  a una cuenta que ya existía es fácil: se insertan las filas locales con el usuario real.
- **Lo que cuesta:** una segunda capa de datos. Hoy leen y escriben en Supabase
  `tareasService`, `temasService`, `useTareas` (realtime), `useTimerActions` (sesiones de
  estudio y racha), `useDashboardStats` (las estadísticas las calcula la RPC en el servidor)
  y `salasService`. Cada uno necesitaría su versión local.
- **Las salas no pueden ser locales:** crear o entrar a una sala, la presencia, el reloj
  compartido y las invitaciones dependen de `auth.uid()` y de `room_members`. Para usar una
  sala, el anónimo igual necesita una sesión en el servidor: quedan dos modelos.
- **No es más durable:** la sesión anónima de Supabase también vive en `localStorage`. Si se
  borra el navegador, se pierde igual en los dos modelos.
- **El caso común no migra nada:** anónimo → cuenta nueva con `linkIdentity` conserva el
  mismo id de usuario. La migración solo hace falta si la persona ya tenía cuenta.

**Propuesta:** seguir con el anónimo en Supabase, pero **crearlo tarde**: recién en la
primera acción que guarda algo (el primer pomodoro terminado, la primera tarea, crear o
entrar a una sala). Quien solo mira, incluidos los bots, no crea nada. Así se obtiene lo
mejor de la idea sin una segunda capa de datos. La Fase B queda solo para quien ya tenía
cuenta. Mientras no exista, el login le avisa que lo de esta sesión no se suma.

## Fase A hecha (2026-10-06)

Leo eligió el anónimo en Supabase creado tarde.
- `authHelpers.asegurarSesion()`: devuelve el id de la sesión o crea la anónima (una sola
  aunque la pidan varios a la vez). La llaman justo antes de escribir: `useTareas`
  (alta y guardado), `useTemas`, `ProveedorNuevaTarea`, el fin del pomodoro
  (`useTimerActions`), `salasService` (crear, unirse por código o por id),
  `calendarService.createEvent` y `conectarGoogleCalendar`.
- `AuthContext`: sin sesión, `user` es null y la app se usa igual (expone `cargando`). Ya no
  manda a `/login`. Cerrar sesión de una cuenta vuelve al home sin cuenta.
- `entrarCon(proveedor, volverA)`: el anónimo vincula (`linkIdentity`); sin sesión, entra
  (`signInWithOAuth`). Lo pendiente queda en `sessionStorage`. Si vuelve con
  `identity_already_exists`, `resolverRegresoOAuth` entra a la cuenta que ya existía. Al
  volver con cuenta, `cerrarEntradaPendiente` avisa y devuelve a `?redirect=` (solo rutas
  internas: `rutaSegura`).
- Login: la puerta única con los textos del diseño final, todavía con los componentes de
  hoy (el look final llega con la Fase 3). `/registro` redirige a `/login` con su query.
- Menú de la cuenta: sin sesión, «Entrar»; anónimo, «Guardar mi progreso» y «Editar
  nombre» (ya no cierra sesión); con cuenta, «Cerrar sesión». Avatar con la inicial.
- `InvitacionPage` y `RoomPage` ya no piden sesión: unirse crea la anónima.
- Tests en `authHelpers.test.ts`. Probado en el navegador: el home carga sin sesión ni
  redirección, y `/registro?redirect=…` cae en el login con «Seguir sin cuenta» a esa ruta.
  No se probó el ida y vuelta real con un proveedor (crearía usuarios en producción).

## Dónde retomamos

✅ Diseño aprobado y Fase A en código. Falta probar el ida y vuelta con un proveedor en el
deploy de prueba. Después, Fase B (sumar lo del anónimo a una cuenta que ya existía) y C.
