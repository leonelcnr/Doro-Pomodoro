import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Login · Fase B (docs/rediseno/login.md). Quien usó Doro sin cuenta y después
// entró a una cuenta que ya existía manda el token del anónimo; esto pasa lo que
// hizo a la cuenta (RPC `fusionar_anonimo`, una transacción) y borra al anónimo.
//
// Se comprueban los dos lados con sus propios JWT: el de la cuenta viene en el
// header (y no puede ser anónimo) y el del anónimo en el cuerpo (y tiene que
// serlo). Así nadie puede llevarse los datos de otro con solo conocer su id.

// Orígenes permitidos: env `ALLOWED_ORIGINS` (lista separada por comas). Sin
// allowlist configurada, se cae a "*" como las otras funciones.
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
  const responder = (cuerpo: unknown, status = 200) =>
    new Response(JSON.stringify(cuerpo), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return responder({ error: "Missing auth token" }, 401);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // La cuenta: el usuario que llama
    const { data: { user: cuenta } } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (!cuenta || cuenta.is_anonymous) return responder({ error: "Unauthorized" }, 401);

    // El anónimo: su token, guardado por el cliente antes de entrar a la cuenta
    const body = await req.json().catch(() => ({}));
    const tokenAnonimo = body?.token_anonimo;
    if (typeof tokenAnonimo !== "string" || tokenAnonimo.length === 0) {
      return responder({ error: "Missing token_anonimo" }, 400);
    }
    const { data: { user: anonimo } } = await supabaseAdmin.auth.getUser(tokenAnonimo);
    if (!anonimo || !anonimo.is_anonymous) {
      // Vencido, ya borrado (otra pestaña lo sumó) o no era anónimo
      return responder({ error: "Anonymous session not valid" }, 410);
    }

    const { error: errorFusion } = await supabaseAdmin.rpc("fusionar_anonimo", {
      p_anonimo: anonimo.id,
      p_cuenta: cuenta.id,
    });
    if (errorFusion) throw new Error(errorFusion.message);

    // Ya no tiene nada: se borra (el resto de sus filas cae por cascada)
    const { error: errorBorrado } = await supabaseAdmin.auth.admin.deleteUser(anonimo.id);
    if (errorBorrado) console.error("No se pudo borrar el anónimo:", errorBorrado.message);

    return responder({ success: true });
  } catch (error) {
    return responder({ error: (error as Error).message }, 500);
  }
});
