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

export type Proveedor = "google" | "github" | "discord";

const NOMBRES_PROVEEDOR: Record<Proveedor, string> = {
  google: "Google",
  github: "GitHub",
  discord: "Discord",
};

let sesionEnCurso: Promise<string> | null = null;

/**
 * Devuelve el id del usuario de la sesión y, si no hay sesión, crea la anónima.
 *
 * Quien entra a Doro no tiene sesión hasta que guarda algo (el primer pomodoro,
 * la primera tarea, crear o entrar a una sala): así quien solo mira, bots
 * incluidos, no deja usuarios en la base. Lo llaman los hooks y servicios justo
 * antes de escribir. Varias llamadas a la vez comparten la misma creación.
 */
export function asegurarSesion(): Promise<string> {
  sesionEnCurso ??= (async () => {
    const { data: { session: sesion } } = await supabase.auth.getSession();
    if (sesion) return sesion.user.id;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    if (!data.user) throw new Error("No se pudo crear la sesión.");
    if (!localStorage.getItem("anon_name")) localStorage.setItem("anon_name", "Anónimo");
    return data.user.id;
  })().finally(() => {
    sesionEnCurso = null;
  });
  return sesionEnCurso;
}

/**
 * Lo que hay que recordar mientras el navegador va y vuelve del proveedor: el
 * OAuth recarga la página, así que vive en `sessionStorage`.
 */
interface EntradaPendiente {
  proveedor: Proveedor;
  // El anónimo vincula el proveedor (conserva su id y sus datos)
  vinculando: boolean;
  // La cuenta ya existía y se entró a ella: lo del anónimo no se sumó (Fase B)
  cuentaExistente: boolean;
  volverA: string;
}

const CLAVE_ENTRADA = "doro_entrada_pendiente";

function leerEntradaPendiente(): EntradaPendiente | null {
  try {
    const crudo = sessionStorage.getItem(CLAVE_ENTRADA);
    return crudo ? (JSON.parse(crudo) as EntradaPendiente) : null;
  } catch {
    return null;
  }
}

/** Solo rutas internas: evita que `?redirect=` mande a otro sitio. */
export function rutaSegura(ruta: string | null | undefined): string {
  return ruta && ruta.startsWith("/") && !ruta.startsWith("//") ? ruta : "/";
}

function opcionesOAuth(proveedor: Proveedor) {
  return {
    redirectTo: `${window.location.origin}/`,
    ...(proveedor === "google" ? { queryParams: { prompt: "select_account" } } : {}),
  };
}

async function irAlProveedor(entrada: EntradaPendiente): Promise<void> {
  sessionStorage.setItem(CLAVE_ENTRADA, JSON.stringify(entrada));
  const opciones = opcionesOAuth(entrada.proveedor);
  const { error } = entrada.vinculando
    ? await supabase.auth.linkIdentity({ provider: entrada.proveedor, options: opciones })
    : await supabase.auth.signInWithOAuth({ provider: entrada.proveedor, options: opciones });
  if (error) {
    sessionStorage.removeItem(CLAVE_ENTRADA);
    throw error;
  }
}

/**
 * La única puerta del login: no hay «crear cuenta» ni «iniciar sesión».
 * - Anónimo: vincula el proveedor y pasa a ser esa cuenta sin perder nada.
 * - Sin sesión: entra con el proveedor (la cuenta se crea si no existía).
 * Si la cuenta ya existía, el regreso trae `identity_already_exists` y
 * `resolverRegresoOAuth` entra a ella.
 */
export async function entrarCon(proveedor: Proveedor, volverA: string): Promise<void> {
  const { data: { session: sesion } } = await supabase.auth.getSession();
  await irAlProveedor({
    proveedor,
    vinculando: sesion?.user.is_anonymous ?? false,
    cuentaExistente: false,
    volverA: rutaSegura(volverA),
  });
}

/**
 * Al volver del proveedor con error. Supabase lo devuelve en el hash o en el
 * query string. Si el anónimo quiso vincular una cuenta que ya existía, entra a
 * ella. Si no, muestra el error. Siempre limpia la URL para que no reaparezca.
 */
export function resolverRegresoOAuth(): void {
  const paramsHash = new URLSearchParams(window.location.hash.replace("#", "?"));
  const paramsConsulta = new URLSearchParams(window.location.search);
  const codigoError = paramsHash.get("error_code") || paramsConsulta.get("error_code");

  if (!codigoError) return;
  window.history.replaceState(null, "", window.location.pathname);

  const entrada = leerEntradaPendiente();
  sessionStorage.removeItem(CLAVE_ENTRADA);

  if (codigoError === "identity_already_exists" && entrada?.vinculando) {
    void irAlProveedor({ ...entrada, vinculando: false, cuentaExistente: true }).catch(
      (error: unknown) => {
        console.error(error);
        toast.error("No se pudo entrar a tu cuenta.");
      }
    );
    return;
  }

  if (codigoError === "identity_already_exists") {
    toast.error("Esa cuenta ya es de otro usuario", {
      description: "Entrá con ella desde «Entrar» para usarla.",
    });
  } else {
    const descripcionError = paramsHash.get("error_description") || paramsConsulta.get("error_description");
    toast.error("No se pudo entrar", {
      description: descripcionError?.replace(/\+/g, " ") || "Probá de nuevo en un momento.",
    });
  }
}

/**
 * Cuando la sesión ya es de una cuenta y había una entrada pendiente: avisa cómo
 * salió y devuelve a dónde volver (o null si no había nada pendiente).
 */
export function cerrarEntradaPendiente(): string | null {
  const entrada = leerEntradaPendiente();
  if (!entrada) return null;
  sessionStorage.removeItem(CLAVE_ENTRADA);

  const nombre = NOMBRES_PROVEEDOR[entrada.proveedor];
  if (entrada.vinculando) {
    toast.success(`Listo: lo que hiciste quedó en tu cuenta de ${nombre}`);
  } else if (entrada.cuentaExistente) {
    toast.success(`Entraste a tu cuenta de ${nombre}`, {
      description: "Lo que hiciste sin cuenta no se sumó: esa cuenta ya existía.",
    });
  } else {
    toast.success(`Entraste con ${nombre}`);
  }
  return entrada.volverA;
}

/**
 * Persiste el `provider_refresh_token` de la sesión en una tabla protegida vía la
 * Edge Function `save-google-token` (RLS deny-all, solo `service_role`). Antes se
 * guardaba en `user_metadata`, que era legible desde el cliente por el JWT; el
 * refresh token de Google es de larga vida, así que no debe quedar accesible al
 * navegador. Lo mandamos nosotros porque Supabase a veces no actualiza
 * `identity_data` al reconectar una cuenta ya existente. Luego lo usa la Edge
 * Function de Google Calendar (`sync-calendar`).
 *
 * Fire-and-forget desde el `AuthProvider`: si falla, el calendario simplemente
 * pedirá reconectar en el próximo `sync-calendar`; no bloqueamos el login.
 */
export async function persistirRefreshToken(sesion: Session): Promise<void> {
  if (!sesion.provider_refresh_token) return;

  const { error } = await supabase.functions.invoke("save-google-token", {
    body: { refresh_token: sesion.provider_refresh_token },
  });

  if (error) {
    console.error("No se pudo guardar el refresh token de Google:", error);
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
  await asegurarSesion();
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
