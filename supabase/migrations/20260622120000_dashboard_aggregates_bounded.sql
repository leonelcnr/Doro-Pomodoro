-- =====================================================================
-- Acota get_dashboard_aggregates para que escale con la antigüedad de la
-- cuenta. La tabla pesada es study_sessions: antes se agregaba TODO el
-- historial en cada llamada (y en cada invalidación realtime).
--
-- Cambios:
--   * `daily`  -> se limita a los últimos 366 días. Cubre todos los rangos
--                de la UI (máx. 90 días en gráficos) y el mapa de calor (1 año).
--   * Se agrega `all_time_sessions`: conteo escalar de sesiones de todo el
--     historial. El dashboard lo usa para el promedio del rango "Total"
--     (total_study_minutes histórico / sesiones histórico), que de otro
--     modo quedaría inflado al acotar `daily`.
--   * `tasks` se deja SIN acotar a propósito: es una tabla liviana (se agrupa
--     por día/tipo) y el rango "Total"/torta debe reflejar todo el historial.
--   * `hourly` ya estaba acotado a 7 días.
--
-- Mantiene SECURITY DEFINER + el chequeo de autorización C4 (IDOR).
-- =====================================================================

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

    select json_agg(t) into v_tasks
    from (
        select
            (created_at at time zone 'America/Argentina/Buenos_Aires')::date as stat_date,
            coalesce(type, 'Otro') as task_type,
            count(*) as tasks_count
        from tasks
        where user_id = p_user_id and status = 'Completada'
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
