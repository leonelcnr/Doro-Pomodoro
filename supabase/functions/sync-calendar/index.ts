import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    const providerRefreshToken = googleIdentity.identity_data?.provider_refresh_token || adminUser.user.user_metadata?.provider_refresh_token;
    
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
