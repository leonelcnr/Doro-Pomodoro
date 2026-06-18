import { toast } from "sonner";
import type { Session } from "@supabase/supabase-js";
import supabase from "@/lib/supabase";
import type { Usuario } from "@/types/dominio";

/**
 * Helpers del flujo de autenticación, extraídos del `AuthProvider` para
 * adelgazarlo (Fase 4 del plan). Cada uno encapsula una responsabilidad que
 * antes vivía inline mezclada con el estado del contexto.
 */

const ALCANCE_CALENDARIO = "https://www.googleapis.com/auth/calendar";

/**
 * Lee la URL en busca de errores de OAuth/vinculación (Supabase los devuelve en
 * el hash o el query string), muestra el toast correspondiente y limpia la URL
 * para que el error no reaparezca al recargar.
 */
export function mostrarErrorOAuthDesdeUrl(): void {
  const paramsHash = new URLSearchParams(window.location.hash.replace("#", "?"));
  const paramsConsulta = new URLSearchParams(window.location.search);
  const codigoError = paramsHash.get("error_code") || paramsConsulta.get("error_code");

  if (!codigoError) return;

  if (codigoError === "identity_already_exists") {
    toast.error("Esta cuenta ya está registrada", {
      description:
        "La cuenta de Google/Github intentada ya pertenece a otro usuario registrado. Por favor, inicia sesión normalmente con ella.",
    });
  } else {
    const descripcionError = paramsHash.get("error_description") || paramsConsulta.get("error_description");
    toast.error("Error de autenticación", {
      description: descripcionError?.replace(/\+/g, " ") || "No se pudo vincular la cuenta.",
    });
  }

  // Limpiamos la URL para no mostrar el error en las recargas
  window.history.replaceState(null, "", window.location.pathname);
}

/**
 * Persiste el `provider_refresh_token` de la sesión en `user_metadata`, porque
 * Supabase Auth a veces no actualiza `identity_data` al reconectar una cuenta ya
 * existente. Luego lo usa nuestra Edge Function de Google Calendar.
 */
export function persistirRefreshToken(sesion: Session): void {
  if (
    sesion.provider_refresh_token &&
    sesion.provider_refresh_token !== sesion.user.user_metadata?.provider_refresh_token
  ) {
    supabase.auth.updateUser({
      data: { provider_refresh_token: sesion.provider_refresh_token },
    });
  }
}

/**
 * Conecta Google Calendar para cualquier tipo de usuario:
 * - Usuarios de Google: se reautentican pidiendo el scope de calendario.
 * - Usuarios de Discord/anónimos: vinculan la identidad de Google con ese scope.
 * Pedimos acceso offline para que Supabase guarde el `provider_refresh_token`,
 * que luego usará nuestra Edge Function.
 */
export async function conectarGoogleCalendar(): Promise<void> {
  const { data: { session: sesion } } = await supabase.auth.getSession();
  const identidades = sesion?.user?.identities ?? [];
  const tieneGoogle = identidades.some((i) => i.provider === "google");

  const redireccion = `${window.location.origin}/calendar`;
  const opciones = {
    redirectTo: redireccion,
    scopes: ALCANCE_CALENDARIO,
    queryParams: { prompt: "consent", access_type: "offline" },
  } as const;

  if (tieneGoogle) {
    // Reautenticamos para obtener el scope de calendario (Google entrega refresh_token si se pide 'consent')
    await supabase.auth.signInWithOAuth({ provider: "google", options: opciones });
  } else {
    // Vinculamos Google a la cuenta existente (Discord/anónima)
    await supabase.auth.linkIdentity({ provider: "google", options: opciones });
  }
}

/**
 * Mapea el usuario de la sesión de Supabase (campos en inglés) al contrato de
 * dominio `Usuario`. Aísla acá la conversión para que el AuthContext y la UI no
 * dependan de la forma cruda de la sesión.
 */
export function mapearUsuario(sesion: Session): Usuario {
  const esAnonimo = sesion.user.is_anonymous ?? false;
  const nombreAnonimo = localStorage.getItem("anon_name") || "Anónimo";
  const metadata = sesion.user.user_metadata ?? {};

  return {
    ...metadata,
    id: sesion.user.id,
    email: esAnonimo ? "" : (sesion.user.email ?? ""),
    isAnonymous: esAnonimo,
    name: esAnonimo
      ? nombreAnonimo
      : (metadata.name || sesion.user.email?.split("@")[0] || "Usuario"),
    avatar_url: metadata.avatar_url || "",
    provider_token: sesion.provider_token ?? null,
  };
}
