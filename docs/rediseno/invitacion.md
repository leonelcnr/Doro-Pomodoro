# Rediseño · Invitación

Pantalla `/invitacion/:code`: lo que ve quien abre un link de invitación a una sala. Parte
de la Fase 1 de `docs/plan-rediseno.md`, que tiene las reglas generales, el formato de los
bocetos y las decisiones transversales.

**Archivos de esta pantalla** (los toca solo la sesión que trabaja en ella):
`docs/rediseno/invitacion.md` y `bocetos/invitacion.html`.

Al commitear, nombrar las rutas, nunca `git add .`: puede haber otras sesiones trabajando en
paralelo. Del plan general solo se toca la fila de esta pantalla en la tabla.

---

Boceto: https://claude.ai/artifact/Piaju275X2WUEUzh73d1Sm · fuente `bocetos/invitacion.html`.

## Cómo está hoy (leído del código, 2026-10-06)

- `InvitacionPage` se une sola: muestra «Procesando tu invitación…» y salta a la sala.
  Quien llega no sabe a qué sala entra hasta estar adentro.
- Si el link venció, muestra el mensaje crudo de Postgres («Invite inválido o expirado»).
- Al anónimo los demás lo ven como «Usuario»: la presencia arma el nombre con el email.
- **Pegar el link en el home no funciona:** `parsearInvitacion` busca `/invite/`, pero los
  links son `/invitacion/`. Cae en «código suelto» y manda la URL entera a `join_room`.
- `join_room` suma un uso aunque ya fueras miembro; con `max_uses` se puede agotar el link
  entrando dos veces.
- Con RLS, quien no es miembro no puede leer la sala: para mostrar algo antes de entrar
  hace falta una RPC (`ver_invitacion`, en el cierre del boceto) que devuelva solo lo que se
  muestra y no cree sesión. El anónimo se crea recién al tocar «Entrar» (Fase C del login,
  bots).

## Decisión (2026-10-06): 1 · Directo

**Si ya te pasaron el link es porque querés entrar**: una doble confirmación agrega
fricción. El link te mete en la sala sin preguntar; mientras entra, el arco del anillo gira
con «Entrando a la sala…», y al llegar un aviso dice a qué sala entraste y cómo te ven.

**2 (Una puerta) y 3 (La sala detrás) quedan para el sistema de amigos**: cuando te puedan
invitar directamente dentro de Doro, sí conviene ver quién te invita y a qué sala antes
de aceptar.

Lo que cambia respecto de la recomendación (4):
- No hace falta la RPC `ver_invitacion` para mirar antes de entrar. Queda como referencia
  para la invitación entre amigos.
- El anónimo entra como «Invitado» y cambia el nombre después, desde la sala. Que la
  presencia lea `user_metadata.nombre` antes del email sigue haciendo falta.
- Riesgo de bots: un crawler que abra el link crea un anónimo y suma un uso. Lo mitiga la
  Fase C del login (no crear sesión hasta la primera acción / Turnstile); para previews de
  links (WhatsApp, Discord), que la página no se una en el render sin JS o que filtre
  user-agents de previews.
- Errores (venció / no existe) y «Ya estabas» quedan como en el boceto.
- **Sin tope de usos** (Leo, 2026-10-06): al principio se pensó en limitar los usos de un
  link, pero una sala es espontánea y no tiene sentido. El error «se agotó» desaparece:
  solo queda «venció» (si algún día se usa `expires_at`) y «no existe».

### Arreglado (2026-10-06)

- `parsearInvitacion` reconoce `/invitacion/XXXX`: pegar el link en el home ya funciona.
- Migración `20261007003452_invitaciones_sin_tope_de_usos.sql`: `join_room` deja de mirar
  `max_uses` y de contar usos (también acepta el código en minúsculas); `create_room`
  conserva `p_max_uses` en la firma pero lo ignora. El frontend ya no lee `max_uses` ni
  `uses`. Las columnas se borran en otra migración, cuando el frontend nuevo esté
  desplegado.

## Primera ronda (publicada 2026-10-06)

Mundo del home D4 y de la sala final: fondo neutro, un acento, líneas finas. Ajustes
nuevos: **Link** (sirve / venció / no existe / ya estabas), **Quién abre** (recién llegado /
con cuenta), **La sala** (estudiando / en pausa / vacía) y **Carga** (rápida / lenta).
«Abrir el link otra vez» repite la llegada.

- **1 · Directo.** Como hoy, pero cuidado: carga con el arco del anillo y al llegar un
  aviso dice a qué sala entraste y cómo te ven. Cero clics, pero entrás a ciegas.
- **2 · Una puerta.** Una pantalla antes de la sala, en el idioma del login: quién invita,
  la sala, cómo va el reloj y «Entrar a la sala». El anónimo escribe su nombre ahí.
- **3 · La sala detrás.** La sala atenuada (sin desenfoque) detrás de una hoja que sube
  desde abajo con lo de 2. El reloj queda visible por encima de la hoja y baja al centro
  al entrar.
- **4 · El reloj primero** (recomendada). La invitación es la sala sin controles: arriba
  «Ana te invita a…», el reloj corriendo, y donde van los botones, el nombre y «Entrar».
  Al entrar no cambia la pantalla: aparecen los controles, «Salir» y tu avatar.

**Errores, iguales en las cuatro:** «Este link ya no sirve» (venció o se agotó) y «No
encontramos esta sala» (no existe o se cerró), con el renglón del home para pegar otro
link e «Ir a Doro». **Ya estabas:** sin puerta, entrás directo con «Volviste a…».

**Fondo:** liso, como se decidió. En 4 los puntos compiten con el reloj, igual que en la sala.

### Revisión (2026-10-06)

Revisado en Chrome headless en escritorio y celular, claro y oscuro: sin errores de JS, y
con las cuatro «Entrar» te deja adentro con el nombre que escribiste. Se corrigieron dos
cosas antes de publicar:
- En 3 la hoja tapaba el reloj entero, también en escritorio. Ahora la sala reserva el alto
  de la hoja (`--hoja`, medido con `ResizeObserver`) y el reloj queda arriba.
- El ícono de link roto se leía como «¿?»; ahora es el de link cortado de Lucide.

## Propuestas transversales

- El arreglo de `parsearInvitacion` (`/invite/` → `/invitacion/`) es un bug de hoy, no del
  rediseño: se puede arreglar antes.
- El nombre del anónimo (`user_metadata.nombre`, que la presencia leería primero) sirve
  también para la sala y el login.
