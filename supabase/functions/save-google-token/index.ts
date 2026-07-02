import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Persiste el `provider_refresh_token` de Google en la tabla protegida
// `google_credentials` (RLS deny-all, solo service_role). Reemplaza el guardado
// previo en `user_metadata`, que era legible desde el cliente vía el JWT.
// El cliente manda el token porque `identity_data` a veces no se actualiza al
// reconectar una cuenta ya existente (ver authHelpers.persistirRefreshToken).

// Orígenes permitidos: env `ALLOWED_ORIGINS` (lista separada por comas). Sin
// allowlist configurada, se cae a "*" para no romper despliegues existentes.
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsFor(origin: string | null) {
  const allowOrigin = allowedOrigins.length === 0
    ? "*"
    : (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verificamos al usuario con su propio JWT antes de guardar nada a su nombre.
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const refreshToken = body?.refresh_token;

    if (typeof refreshToken !== "string" || refreshToken.length === 0) {
      return new Response(JSON.stringify({ error: "Missing refresh_token" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert con service_role (bypassa la RLS deny-all de la tabla).
    const { error: upsertError } = await supabaseAdmin
      .from("google_credentials")
      .upsert(
        { user_id: user.id, refresh_token: refreshToken, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
