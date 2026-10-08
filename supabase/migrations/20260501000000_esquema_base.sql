-- =====================================================================
-- Esquema base: lo que había en producción antes de la primera migración
-- del repo (20260512202808). Sacado del dump de producción del 2026-10-05,
-- sin lo que crean las migraciones siguientes. Ya está aplicado en
-- producción: se marca con `supabase migration repair --status applied`.
-- Sirve para que `supabase start` / `db reset` levanten la base local
-- desde cero. No editar: los cambios van en migraciones nuevas.
-- =====================================================================




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."create_room"("p_name" "text", "p_is_public" boolean DEFAULT false, "p_max_uses" integer DEFAULT NULL::integer, "p_expires_minutes" integer DEFAULT NULL::integer) RETURNS TABLE("room_id" "uuid", "invite_code" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_room_id uuid;
  v_code text;
  v_expires_at timestamptz;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'El nombre de sala es muy corto';
  end if;

  -- Expiración opcional
  if p_expires_minutes is not null then
    v_expires_at := now() + make_interval(mins => p_expires_minutes);
  else
    v_expires_at := null;
  end if;

  -- 1) Crear sala
  insert into public.rooms (name, host_id, is_public)
  values (trim(p_name), auth.uid(), coalesce(p_is_public, false))
  returning id into v_room_id;

  -- 2) Agregar host como miembro
  insert into public.room_members (room_id, user_id, role)
  values (v_room_id, auth.uid(), 'host')
  on conflict do nothing;

  -- 3) Generar código y crear invite (reintenta si colisiona)
  for i in 1..10 loop
    -- 8 chars hex (0-9A-F), simple y suficiente para MVP
    v_code := upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 8));

    begin
      insert into public.room_invites (code, room_id, created_by, expires_at, max_uses)
      values (v_code, v_room_id, auth.uid(), v_expires_at, p_max_uses);

      -- OK -> devolvemos
      room_id := v_room_id;
      invite_code := v_code;
      return next;

      return;
    exception
      when unique_violation then
        -- si el code ya existe, reintenta
        null;
    end;
  end loop;

  raise exception 'No se pudo generar un invite_code (muchas colisiones)';
end;
$$;


ALTER FUNCTION "public"."create_room"("p_name" "text", "p_is_public" boolean, "p_max_uses" integer, "p_expires_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_study_stats"("p_user_id" "uuid", "p_period" "text", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE("period_start" timestamp with time zone, "total_minutes" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    if p_user_id is distinct from auth.uid() then
        raise exception 'No autorizado';
    end if;

    return query
    select
        date_trunc(p_period, created_at) as period_start,
        coalesce(sum(duration_minutes)::bigint, 0) as total_minutes
    from study_sessions
    where user_id = p_user_id
      and (p_start_date is null or created_at >= p_start_date)
      and (p_end_date   is null or created_at <= p_end_date)
    group by period_start
    order by period_start asc;
end;
$$;


ALTER FUNCTION "public"."get_study_stats"("p_user_id" "uuid", "p_period" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_room"("p_code" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_room_id uuid;
begin
  -- 1) Validar invite (y bloquear fila para evitar condiciones de carrera)
  select room_id into v_room_id
  from public.room_invites
  where code = p_code
    and (expires_at is null or expires_at > now())
    and (max_uses is null or uses < max_uses)
  for update;

  if v_room_id is null then
    raise exception 'Invite inválido o expirado';
  end if;

  -- 2) Agregar miembro (idempotente)
  insert into public.room_members(room_id, user_id, role)
  values (v_room_id, auth.uid(), 'member')
  on conflict do nothing;

  -- 3) Incrementar usos (si max_uses era null igual suma, no molesta)
  update public.room_invites
  set uses = uses + 1
  where code = p_code;

  -- 4) devolver room_id para redireccionar
  return v_room_id;
end;
$$;


ALTER FUNCTION "public"."join_room"("p_code" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_room_by_id"("p_room_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if not exists (select 1 from public.rooms where id = p_room_id) then
    raise exception 'La sala no existe';
  end if;

  insert into public.room_members (room_id, user_id, role)
  values (p_room_id, auth.uid(), 'member')
  on conflict (room_id, user_id) do nothing;
end;
$$;


ALTER FUNCTION "public"."join_room_by_id"("p_room_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_room_sync"("p_room_id" "uuid", "p_timer_state" "jsonb" DEFAULT NULL::"jsonb", "p_music_state" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  if not exists (
    select 1 from public.room_members m
    where m.room_id = p_room_id and m.user_id = auth.uid()
  ) then
    raise exception 'No sos miembro de esta sala';
  end if;

  update public.rooms
  set timer_state = coalesce(p_timer_state, timer_state),
      music_state = coalesce(p_music_state, music_state)
  where id = p_room_id;
end;
$$;


ALTER FUNCTION "public"."update_room_sync"("p_room_id" "uuid", "p_timer_state" "jsonb", "p_music_state" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_stats_after_session"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    last_date DATE;
    today DATE := CURRENT_DATE;
    yesterday DATE := CURRENT_DATE - 1;
    curr_streak INTEGER;
    long_streak INTEGER;
BEGIN
    -- Intentar obtener las estadísticas actuales del usuario
    SELECT last_study_date, current_streak, longest_streak 
    INTO last_date, curr_streak, long_streak
    FROM public.user_stats 
    WHERE user_id = NEW.user_id;

    -- Si no tiene estadísticas iniciales, crearlas
    IF NOT FOUND THEN
        INSERT INTO public.user_stats (user_id, current_streak, longest_streak, last_study_date, total_study_minutes)
        VALUES (NEW.user_id, 1, 1, today, NEW.duration_minutes);
        RETURN NEW;
    END IF;

    -- Si ya estudió hoy, solo sumamos los minutos
    IF last_date = today THEN
        UPDATE public.user_stats
        SET total_study_minutes = total_study_minutes + NEW.duration_minutes
        WHERE user_id = NEW.user_id;
    -- Si estudió ayer, racha continúa
    ELSIF last_date = yesterday THEN
        curr_streak := curr_streak + 1;
        IF curr_streak > long_streak THEN
            long_streak := curr_streak;
        END IF;
        
        UPDATE public.user_stats
        SET 
            current_streak = curr_streak,
            longest_streak = long_streak,
            last_study_date = today,
            total_study_minutes = total_study_minutes + NEW.duration_minutes
        WHERE user_id = NEW.user_id;
    -- Si han pasado más días, la racha se reinicia a 1
    ELSE
        UPDATE public.user_stats
        SET 
            current_streak = 1,
            last_study_date = today,
            total_study_minutes = total_study_minutes + NEW.duration_minutes
        WHERE user_id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_stats_after_session"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."calendar_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "event_date" "date" NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "google_event_id" "text",
    CONSTRAINT "calendar_events_type_check" CHECK (("type" = ANY (ARRAY['Examen'::"text", 'Entrega'::"text", 'Estudio'::"text", 'Otro'::"text"])))
);


ALTER TABLE "public"."calendar_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_invites" (
    "code" "text" NOT NULL,
    "room_id" "uuid" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone,
    "max_uses" integer,
    "uses" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."room_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."room_members" (
    "room_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "room_members_role_check" CHECK (("role" = ANY (ARRAY['host'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."room_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "host_id" "uuid" NOT NULL,
    "is_public" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "timer_state" "jsonb" DEFAULT '{"modo": "pomodoro", "estaActivo": false, "actualizadoEn": null, "tiempoRestante": 1500}'::"jsonb",
    "music_state" "jsonb"
);

ALTER TABLE ONLY "public"."rooms" REPLICA IDENTITY FULL;


ALTER TABLE "public"."rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_sessions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "duration_minutes" integer NOT NULL,
    "task_id" bigint,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."study_sessions" OWNER TO "postgres";


ALTER TABLE "public"."study_sessions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."study_sessions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "room_id" "uuid",
    "header" "text" NOT NULL,
    "type" "text" DEFAULT 'General'::"text",
    "status" "text" DEFAULT 'Sin Empezar'::"text",
    "priority" "text" DEFAULT 'Medium'::"text",
    "favorite" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "order_index" integer
);

ALTER TABLE ONLY "public"."tasks" REPLICA IDENTITY FULL;


ALTER TABLE "public"."tasks" OWNER TO "postgres";


ALTER TABLE "public"."tasks" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


CREATE TABLE IF NOT EXISTS "public"."user_stats" (
    "user_id" "uuid" NOT NULL,
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "last_study_date" "date",
    "total_study_minutes" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);

ALTER TABLE ONLY "public"."user_stats" REPLICA IDENTITY FULL;


ALTER TABLE "public"."user_stats" OWNER TO "postgres";


ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."room_invites"
    ADD CONSTRAINT "room_invites_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."room_members"
    ADD CONSTRAINT "room_members_pkey" PRIMARY KEY ("room_id", "user_id");



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "idx_room_invites_room" ON "public"."room_invites" USING "btree" ("room_id");



CREATE INDEX "idx_room_members_user" ON "public"."room_members" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "calendar_events_updated_at" BEFORE UPDATE ON "public"."calendar_events" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_update_stats" AFTER INSERT ON "public"."study_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_stats_after_session"();



ALTER TABLE ONLY "public"."calendar_events"
    ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_invites"
    ADD CONSTRAINT "room_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_invites"
    ADD CONSTRAINT "room_invites_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_members"
    ADD CONSTRAINT "room_members_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."room_members"
    ADD CONSTRAINT "room_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."study_sessions"
    ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_stats"
    ADD CONSTRAINT "user_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Users can manage their own events" ON "public"."calendar_events" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Usuarios pueden actualizar sus stats" ON "public"."user_stats" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuarios pueden insertar sus sesiones" ON "public"."study_sessions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuarios pueden insertar sus stats" ON "public"."user_stats" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuarios pueden ver sus propias sesiones" ON "public"."study_sessions" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Usuarios pueden ver sus propios stats" ON "public"."user_stats" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "invites_insert_host" ON "public"."room_invites" FOR INSERT WITH CHECK ((("created_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM "public"."rooms" "r"
  WHERE (("r"."id" = "room_invites"."room_id") AND ("r"."host_id" = "auth"."uid"()))))));



CREATE POLICY "members_select_self" ON "public"."room_members" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."room_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."room_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "rooms_delete_host" ON "public"."rooms" FOR DELETE USING (("host_id" = "auth"."uid"()));



CREATE POLICY "rooms_insert_host" ON "public"."rooms" FOR INSERT WITH CHECK (("host_id" = "auth"."uid"()));



CREATE POLICY "rooms_update_host" ON "public"."rooms" FOR UPDATE USING (("host_id" = "auth"."uid"())) WITH CHECK (("host_id" = "auth"."uid"()));



ALTER TABLE "public"."study_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;



ALTER TABLE "public"."user_stats" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."create_room"("p_name" "text", "p_is_public" boolean, "p_max_uses" integer, "p_expires_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_room"("p_name" "text", "p_is_public" boolean, "p_max_uses" integer, "p_expires_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_room"("p_name" "text", "p_is_public" boolean, "p_max_uses" integer, "p_expires_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_study_stats"("p_user_id" "uuid", "p_period" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."get_study_stats"("p_user_id" "uuid", "p_period" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_study_stats"("p_user_id" "uuid", "p_period" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."join_room"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."join_room"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_room"("p_code" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."join_room_by_id"("p_room_id" "uuid") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."join_room_by_id"("p_room_id" "uuid") FROM "anon", "authenticated", "service_role";
GRANT ALL ON FUNCTION "public"."join_room_by_id"("p_room_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."join_room_by_id"("p_room_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_room_by_id"("p_room_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."rls_auto_enable"() FROM "anon", "authenticated", "service_role";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."update_room_sync"("p_room_id" "uuid", "p_timer_state" "jsonb", "p_music_state" "jsonb") FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."update_room_sync"("p_room_id" "uuid", "p_timer_state" "jsonb", "p_music_state" "jsonb") FROM "anon", "authenticated", "service_role";
GRANT ALL ON FUNCTION "public"."update_room_sync"("p_room_id" "uuid", "p_timer_state" "jsonb", "p_music_state" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_room_sync"("p_room_id" "uuid", "p_timer_state" "jsonb", "p_music_state" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_stats_after_session"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_stats_after_session"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_stats_after_session"() TO "service_role";



GRANT ALL ON TABLE "public"."calendar_events" TO "anon";
GRANT ALL ON TABLE "public"."calendar_events" TO "authenticated";
GRANT ALL ON TABLE "public"."calendar_events" TO "service_role";



GRANT ALL ON TABLE "public"."room_invites" TO "anon";
GRANT ALL ON TABLE "public"."room_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."room_invites" TO "service_role";



GRANT ALL ON TABLE "public"."room_members" TO "anon";
GRANT ALL ON TABLE "public"."room_members" TO "authenticated";
GRANT ALL ON TABLE "public"."room_members" TO "service_role";



GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";



GRANT ALL ON TABLE "public"."study_sessions" TO "anon";
GRANT ALL ON TABLE "public"."study_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."study_sessions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."study_sessions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."study_sessions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."study_sessions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";



GRANT ALL ON SEQUENCE "public"."tasks_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tasks_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tasks_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stats" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







