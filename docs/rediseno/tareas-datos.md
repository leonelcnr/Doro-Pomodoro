# Tareas · modelo de datos y migraciones

Diseño de la capa de datos para la pantalla de Tareas aprobada (S2, ver `tareas.md`).
Es la Fase 3 de `docs/plan-rediseno.md`. **Todavía no se aplicó nada:** el SQL de abajo es
un borrador para revisar antes de convertirlo en archivos de `supabase/migrations/`.

Decisiones de Leo (2026-10-04):
- Avisos **por fases**: primero notificaciones del navegador, después Google Calendar.
- **La pantalla de Calendario se elimina**: la reemplaza la vista «Calendario» de Tareas.
- **`/tareas` muestra solo lo personal**; las tareas de sala siguen en la sala.
- **Avisos, primer paso:** solo con la app abierta (B1). Web Push viene después (B2).
- **Los eventos de `calendar_events` se descartan**; no se migran.
- Antes de la Fase C hay que arreglar cómo se guardan los tokens de Google: ver
  `docs/seguridad-google-calendar.md`.

---

## Cómo está hoy (leído de la base, 2026-10-04)

**`tasks`**: 63 filas, 20 usuarios, 33 de sala.
- Columnas: `id bigint identity`, `user_id`, `room_id` (null = personal), `header`, `type`
  (texto libre que hace de categoría, con muchos valores de prueba), `status` («Sin Empezar»,
  «En Progreso», «Completada»), `priority`, `favorite`, `order_index`, `description`,
  `checklist jsonb` (`[{id, texto, hecho}]`, una sola fila lo usa) y `created_at`.
- **No hay fecha de entrega.** El tipo `Tarea` de `src/types/dominio.ts` declara
  `limit?: string`, pero esa columna no existe (corrige lo que decía `tareas.md`).
- RLS: lo personal solo lo ve su dueño; lo de sala, cualquier miembro
  (`20260610024709_security_rls_hardening.sql`).
- La RPC del dashboard agrupa por `type` (`dashboard_aggregates_bounded`).

**`calendar_events`**: 17 filas de 3 usuarios.
- Columnas: `title`, `event_date date`, `type` («Examen», «Entrega», «Estudio», «Otro»),
  `description`, `google_event_id`.
- La usan `calendarService.ts` y la edge function `sync-calendar`, que manda cada evento a
  Google como evento de día completo.
- `google_credentials` guarda el refresh token (lo escribe `save-google-token`).

---

## Decisiones de diseño

1. **Un solo tipo de fila para todo lo que tiene fecha.** Parciales, prácticos, informes y
   tareas viven en `tasks` con una columna `kind`. Comparten casi todo: título, tema, fecha,
   observación, aviso y avance.
2. **El avance va en el `checklist` que ya existe.** No hacen falta columnas nuevas:
   - Práctico: un ítem por punto, con `texto` vacío; el número es la posición.
   - Informe: un ítem por parte, con su nombre en `texto`.
   - Parcial: un ítem por unidad; `texto` es el «Qué entra» opcional y `hecho` dice si se
     repasó.
   - Tarea: las subtareas, como hoy.
3. **«Observaciones» es la `description` de hoy.** Se reusa.
4. **Los temas son una tabla nueva, `topics`, de cada usuario.** Tienen nombre, ícono (de un
   set cerrado) y orden. `tasks.topic_id` en null significa «General».
   - Una FK compuesta `(topic_id, user_id) → topics(id, user_id)` garantiza que el tema
     pertenezca al dueño de la tarea. Así no hace falta una política que consulte `topics`,
     que fallaría para los otros miembros de una sala por su propia RLS.
5. **La fecha es `due_date date` + `due_time time` opcional**, como strings ISO, según
   `CLAUDE.md`. El calendario trabaja por día; la hora sirve para los parciales.
6. **La nota de un parcial rendido es `grade numeric(4,2)`**, entre 0 y 10.
7. **El aviso es un instante absoluto, `remind_at timestamptz`.** El cliente traduce las
   opciones de la UI («el día antes», «mañana 9:00») a una fecha y hora concretas.
8. **`/tareas` muestra lo personal** (`room_id is null`). Las tareas de sala siguen en el
   panel de la sala, como hoy (confirmado).
9. **`type` no se borra todavía.** Lo usan la RPC del dashboard y la tabla del home. Se migra
   a temas y se quita en la limpieza.

---

## Fase A · datos para la pantalla (una migración)

```sql
-- 1. Temas
create table public.topics (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  name       text not null check (length(trim(name)) between 1 and 60),
  icon       text not null default 'libro' check (icon in (
               'llaves','red','diagrama','chispa','sigma','onda','globo','codigo',
               'capas','base','grafico','balanza','dado','libro')),
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  unique (id, user_id)                       -- destino de la FK compuesta
);
create unique index topics_nombre_unico on public.topics (user_id, lower(trim(name)));
alter table public.topics enable row level security;
create policy topics_propios on public.topics
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 2. Columnas nuevas en tasks
alter table public.tasks
  add column kind            text not null default 'tarea'
                             check (kind in ('tarea','practico','informe','parcial')),
  add column topic_id        uuid,
  add column due_date        date,
  add column due_time        time,
  add column grade           numeric(4,2) check (grade between 0 and 10),
  add column remind_at       timestamptz,
  add column google_event_id text,
  add constraint tasks_topic_del_dueno
    foreign key (topic_id, user_id) references public.topics (id, user_id)
    on delete set null (topic_id);
alter table public.tasks
  add constraint tasks_nota_solo_parcial check (grade is null or kind = 'parcial');

create index tasks_usuario_tema on public.tasks (user_id, topic_id) where room_id is null;
create index tasks_usuario_fecha on public.tasks (user_id, due_date) where due_date is not null;

-- 3. Cada categoría personal pasa a ser un tema («General» y vacías quedan sin tema)
insert into public.topics (user_id, name)
select distinct on (user_id, lower(trim(type))) user_id, trim(type)
from public.tasks
where room_id is null and type is not null
  and trim(type) <> '' and lower(trim(type)) <> 'general'
on conflict do nothing;

update public.tasks t set topic_id = tp.id
from public.topics tp
where t.room_id is null and tp.user_id = t.user_id
  and lower(trim(t.type)) = lower(tp.name);

-- 4. El calendario viejo se descarta (decisión de Leo): sus eventos no se migran.
--    Los que ya se habían mandado a Google quedan en el Google Calendar de cada usuario.
drop table public.calendar_events;
```

El `drop` de `calendar_events` va en la misma migración que saca `src/features/calendar/`
del código. Antes, se despliega el front sin la pantalla, para que nadie escriba en la tabla
mientras se borra.

**Código que acompaña la Fase A** (con `dev-datos-realtime`):
- `src/types/dominio.ts`:
  - Agregar `TipoItem = 'tarea' | 'practico' | 'informe' | 'parcial'` y la interfaz `Tema`.
  - Sumar a `Tarea` los campos `kind`, `topic_id`, `due_date`, `due_time`, `grade`,
    `remind_at` y `google_event_id`.
  - Sacar el `limit` que no existe.
- Un `temasService` nuevo y el `tareasService` extendido (los nombres en inglés quedan
  aislados ahí).
- Hooks: `useTemas`, y los de la caja abierta y la vista de calendario.
- Eliminar `src/features/calendar/` (pantalla, servicio y ruta `/calendar`) y el link del
  encabezado.

---

## Fase B · avisos por el navegador

**B1, primero (decidido): solo con la app abierta.** No toca la base: usa `remind_at` de la
Fase A.
- Un hook `useAvisos` carga las tareas con `remind_at` en las próximas 24 h y programa un
  `setTimeout` por cada una (se reprograma al volver a la pestaña, porque los timers se frenan
  en segundo plano).
- Muestra `new Notification(...)` y, si no hay permiso, un toast.
- Para no avisar dos veces entre pestañas o recargas, guarda en `localStorage` los ids ya
  avisados.
- Pide permiso la primera vez que el usuario pone un aviso.

**B2, después: Web Push**, para que el aviso llegue con la pestaña cerrada (service worker,
suscripción y envío desde el servidor):

```sql
alter table public.tasks add column reminder_sent_at timestamptz;
create index tasks_avisos_pendientes on public.tasks (remind_at)
  where remind_at is not null and reminder_sent_at is null;

-- Si el aviso cambia, se vuelve a mandar
create function public.reiniciar_aviso() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.remind_at is distinct from old.remind_at then new.reminder_sent_at := null; end if;
  return new;
end $$;
create trigger tasks_reiniciar_aviso before update of remind_at on public.tasks
  for each row execute function public.reiniciar_aviso();

create table public.push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  endpoint     text not null unique,
  p256dh       text not null,
  auth         text not null,
  user_agent   text,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz
);
alter table public.push_subscriptions enable row level security;
create policy push_propias on public.push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Toma los avisos vencidos y los marca en el mismo paso (dos ejecuciones no se pisan).
-- Solo la llama la edge function con la service role.
create function public.tomar_avisos_pendientes(limite int default 200)
returns table (task_id bigint, user_id uuid, header text, kind text, due_date date)
language sql security definer set search_path = '' as $$
  update public.tasks t set reminder_sent_at = now()
  where t.id in (
    select id from public.tasks
    where remind_at <= now() and reminder_sent_at is null
    order by remind_at limit limite
    for update skip locked)
  returning t.id, t.user_id, t.header, t.kind, t.due_date;
$$;
revoke execute on function public.tomar_avisos_pendientes(int) from public, anon, authenticated;
```

**Piezas del servidor:**
- Edge function `enviar-avisos` (Deno + `npm:web-push`): llama a la RPC, manda un push a cada
  suscripción del usuario y borra las que respondan 404 o 410.
- La dispara **Supabase Cron** cada minuto, con `pg_net`.
- Secretos: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT`.

**Cliente:**
- Un service worker (`public/sw.js`) que muestra la notificación y, al tocarla, abre
  `/tareas` en la caja del tema.
- El permiso ya se pidió en B1; acá solo se suma la suscripción.

---

## Fase C · Google Calendar

- **Antes de esta fase:** arreglar el guardado de los tokens y la detección de «conectado»
  (`docs/seguridad-google-calendar.md`).
- Adaptar `sync-calendar` para que lea de `tasks`: crea, actualiza o borra el evento de
  parciales, prácticos e informes con fecha, y guarda `google_event_id`.

## Fase D · notas de la sala (cuando salgan del `localStorage`)

```sql
create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  topic_id   uuid,
  room_id    uuid references public.rooms (id) on delete set null,
  room_name  text,                -- copia del nombre: la nota sobrevive a la sala
  body       text not null check (length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (topic_id, user_id) references public.topics (id, user_id) on delete set null (topic_id)
);
alter table public.notes enable row level security;
create policy notas_propias on public.notes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

«Pasarla a tareas» inserta una fila en `tasks` (`kind = 'tarea'`, mismo `topic_id`) y borra
la nota.

## Limpieza (después de que la pantalla nueva reemplace a la tabla del home)

- Pasar la RPC del dashboard de `type` a `topics.name`.
- Quitar `tasks.type`. Decidir qué pasa con `priority` y `favorite`, que el diseño nuevo no usa.

---

## Pendiente de confirmar

Nada por ahora. Las tres preguntas anteriores se respondieron el 2026-10-04 (ver arriba).
