CREATE OR REPLACE FUNCTION get_dashboard_aggregates(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_daily JSON;
    v_hourly JSON;
    v_tasks JSON;
BEGIN
    SELECT json_agg(t) INTO v_daily
    FROM (
        SELECT
            (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE AS stat_date,
            EXTRACT(ISODOW FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires'))::INTEGER AS day_of_week,
            SUM(duration_minutes) AS total_minutes,
            COUNT(*) AS sessions_count
        FROM study_sessions
        WHERE user_id = p_user_id
        GROUP BY 1, 2
        ORDER BY 1 ASC
    ) t;

    SELECT json_agg(t) INTO v_hourly
    FROM (
        SELECT
            (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE AS stat_date,
            EXTRACT(HOUR FROM (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires'))::INTEGER AS stat_hour,
            SUM(duration_minutes) AS total_minutes
        FROM study_sessions
        WHERE user_id = p_user_id AND created_at >= (NOW() - INTERVAL '7 days')
        GROUP BY 1, 2
        ORDER BY 1 ASC, 2 ASC
    ) t;

    SELECT json_agg(t) INTO v_tasks
    FROM (
        SELECT
            (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Argentina/Buenos_Aires')::DATE AS stat_date,
            COALESCE(type, 'Otro') AS task_type,
            COUNT(*) AS tasks_count
        FROM tasks
        WHERE user_id = p_user_id AND status = 'Completada'
        GROUP BY 1, 2
        ORDER BY 1 ASC
    ) t;

    RETURN json_build_object(
        'daily', COALESCE(v_daily, '[]'::json),
        'hourly', COALESCE(v_hourly, '[]'::json),
        'tasks', COALESCE(v_tasks, '[]'::json)
    );
END;
$$;
