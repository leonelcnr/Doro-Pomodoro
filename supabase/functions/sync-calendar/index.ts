import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Orígenes permitidos: se configuran en la env `ALLOWED_ORIGINS` (lista separada por
// comas). Si no está seteada, se cae a "*" para no romper despliegues existentes.
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsFor(origin: string | null) {
  // Reflejamos el origin solo si está en la allowlist; sin allowlist configurada, "*".
  const allowOrigin = allowedOrigins.length === 0
    ? "*"
    : (origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

// Valida el payload de un evento antes de mandarlo a Google Calendar
function esPayloadValido(p: unknown): p is CalendarPayload {
  return !!p && typeof p === "object"
    && typeof (p as CalendarPayload).summary === "string"
    && typeof (p as CalendarPayload).date === "string";
}

const CALENDAR_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

// Datos que el cliente envía para crear/actualizar un evento de calendario
interface CalendarPayload {
  summary: string;
  description?: string;
  date: string;
}

function buildBody(payload: CalendarPayload) {
  return {
    summary: payload.summary,
    description: payload.description,
    start: { date: payload.date },
    end: { date: payload.date },
  };
}

async function getGoogleAccessToken(refreshToken: string) {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google Client ID or Secret in environment variables.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Failed to refresh token: ${data.error_description || data.error}`);
  }

  return data.access_token;
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

    // Get the JWT from the token
    const token = authHeader.replace("Bearer ", "");
    
    // Verify user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Now get the user's identities with admin API to see refresh token
    const { data: adminUser, error: adminError } = await supabaseAdmin.auth.admin.getUserById(user.id);
    
    if (adminError || !adminUser?.user) {
      return new Response(JSON.stringify({ error: "User not found in admin" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const googleIdentity = adminUser.user.identities?.find((i) => i.provider === "google");
    if (!googleIdentity) {
      return new Response(JSON.stringify({ error: "Google account not linked" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // El refresh token vive ahora en la tabla protegida `google_credentials`
    // (RLS deny-all, solo service_role). Fallback a `identity_data` durante la
    // transición para cuentas que aún no re-guardaron vía `save-google-token`.
    // Ya NO se lee de `user_metadata` (era legible desde el cliente).
    const { data: cred } = await supabaseAdmin
      .from("google_credentials")
      .select("refresh_token")
      .eq("user_id", user.id)
      .single();

    const providerRefreshToken = cred?.refresh_token || googleIdentity.identity_data?.provider_refresh_token;

    if (!providerRefreshToken) {
      return new Response(JSON.stringify({ error: "Google provider_refresh_token missing. User must reconnect." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getGoogleAccessToken(providerRefreshToken);

    const body = await req.json();
    const { action, payload, googleEventId } = body;

    let res: Response;
    
    if ((action === "CREATE" || action === "UPDATE") && !esPayloadValido(payload)) {
      throw new Error("Invalid payload: 'summary' and 'date' are required");
    }

    switch (action) {
      case "CREATE":
        res = await fetch(CALENDAR_BASE, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildBody(payload)),
        });
        break;
      case "UPDATE":
        if (!googleEventId) throw new Error("Missing googleEventId for UPDATE");
        res = await fetch(`${CALENDAR_BASE}/${googleEventId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildBody(payload)),
        });
        break;
      case "DELETE":
        if (!googleEventId) throw new Error("Missing googleEventId for DELETE");
        res = await fetch(`${CALENDAR_BASE}/${googleEventId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        break;
      default:
        throw new Error("Invalid action");
    }

    let resultData = {};
    if (res.status !== 204 && res.status !== 404) {
      resultData = await res.json();
    }
    
    if (!res.ok && res.status !== 404) {
      throw new Error(`Google Calendar API error: ${res.status}`);
    }

    return new Response(JSON.stringify({ success: true, data: resultData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
