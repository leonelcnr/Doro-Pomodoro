-- =====================================================================
-- Tareas · Fase A del rediseño (ver docs/rediseno/tareas-datos.md)
-- Fecha: 2026-10-05
--
-- Cambios:
--   * Tabla `topics` (temas de cada usuario) con RLS propia.
--   * Columnas nuevas en `tasks`: kind, topic_id, due_date, due_time,
--     grade, remind_at, google_event_id y completed_at.
--   * FK compuesta (topic_id, user_id) -> topics(id, user_id): el tema
--     siempre es del dueño de la tarea, sin políticas que consulten topics.
--   * Trigger que llena `completed_at` cuando el status pasa a «Completada»
--     y lo vacía si deja de estarlo. Las tareas ya completadas quedan con
--     completed_at null (no se sabe cuándo se completaron): la RPC usa
--     created_at como respaldo.
--   * Cada categoría personal (`type`) pasa a ser un tema. «General» y las
--     vacías quedan sin tema. Las tareas de sala no se tocan.
--   * get_dashboard_aggregates agrupa por tema (con `type` de respaldo) y
--     por fecha de completado.
--
-- NO borra calendar_events: eso va en una migración aparte, después de
-- desplegar el front sin la pantalla de Calendario.
-- =====================================================================

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
  add column completed_at    timestamptz,
  add constraint tasks_topic_del_dueno
    foreign key (topic_id, user_id) references public.topics (id, user_id)
    on delete set null (topic_id),
  add constraint tasks_nota_solo_parcial check (grade is null or kind = 'parcial');

create index tasks_usuario_tema  on public.tasks (user_id, topic_id) where room_id is null;
create index tasks_usuario_fecha on public.tasks (user_id, due_date) where due_date is not null;

-- 3. completed_at se mantiene solo
create function public.marcar_completada() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'Completada' then
    if tg_op = 'INSERT' or old.status is distinct from 'Completada' then
      new.completed_at := now();
    end if;
  else
    new.completed_at := null;
  end if;
  return new;
end $$;

create trigger tasks_marcar_completada
  before insert or update of status on public.tasks
  for each row execute function public.marcar_completada();

-- 4. Cada categoría personal pasa a ser un tema
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

-- 5. Dashboard: por tema y por fecha de completado
--    Igual a 20260622143548_dashboard_aggregates_bounded salvo el bloque v_tasks.
create or replace function public.get_dashboard_aggregates(p_user_id uuid)
returns json
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
    v_daily json;
    v_hourly json;
    v_tasks json;
    v_all_time_sessions bigint;
begin
    -- C4: impedir leer estadísticas de otros usuarios
    if p_user_id is distinct from auth.uid() then
        raise exception 'No autorizado';
    end if;

    -- Agregado diario acotado al último año (cubre heatmap + todos los rangos).
    select json_agg(t) into v_daily
    from (
        select
            (created_at at time zone 'America/Argentina/Buenos_Aires')::date as stat_date,
            extract(isodow from (created_at at time zone 'America/Argentina/Buenos_Aires'))::integer as day_of_week,
            sum(duration_minutes) as total_minutes,
            count(*) as sessions_count
        from study_sessions
        where user_id = p_user_id
          and created_at >= (now() - interval '366 days')
        group by 1, 2
        order by 1 asc
    ) t;

    -- Conteo histórico de sesiones (escalar barato) para el promedio del rango "Total".
    select count(*) into v_all_time_sessions
    from study_sessions
    where user_id = p_user_id;

    select json_agg(t) into v_hourly
    from (
        select
            (created_at at time zone 'America/Argentina/Buenos_Aires')::date as stat_date,
            extract(hour from (created_at at time zone 'America/Argentina/Buenos_Aires'))::integer as stat_hour,
            sum(duration_minutes) as total_minutes
        from study_sessions
        where user_id = p_user_id and created_at >= (now() - interval '7 days')
        group by 1, 2
        order by 1 asc, 2 asc
    ) t;

    -- Tema si lo tiene; si no, la categoría vieja (tareas de sala y previas).
    -- Fecha de completado; las completadas antes de esta migración usan created_at.
    select json_agg(t) into v_tasks
    from (
        select
            (coalesce(tk.completed_at, tk.created_at) at time zone 'America/Argentina/Buenos_Aires')::date as stat_date,
            coalesce(tp.name, tk.type, 'Otro') as task_type,
            count(*) as tasks_count
        from tasks tk
        left join topics tp on tp.id = tk.topic_id
        where tk.user_id = p_user_id and tk.status = 'Completada'
        group by 1, 2
        order by 1 asc
    ) t;

    return json_build_object(
        'daily',             coalesce(v_daily, '[]'::json),
        'hourly',            coalesce(v_hourly, '[]'::json),
        'tasks',             coalesce(v_tasks, '[]'::json),
        'all_time_sessions', coalesce(v_all_time_sessions, 0)
    );
end;
$function$;
