import type { RealtimeChannel } from "@supabase/supabase-js";
import supabase from "@/lib/supabase";
import type { EstadoReloj, Invitacion, EstadoMusicaSala } from "@/types/dominio";

/**
 * Capa de servicio para las salas (`rooms`) y sus operaciones relacionadas en
 * Supabase: creación/ingreso vía RPC, invitaciones y estado del reloj compartido.
 *
 * Centraliza las llamadas que antes estaban embebidas en `SalaNueva`,
 * `DialogUnirse`, `InvitacionPage`, `RoomPage` y `TimerDisplay`. Cada función
 * lanza el error de Supabase si algo falla.
 */

// Crea una sala nueva (RPC create_room) y devuelve su id
export async function crearSala(): Promise<string> {
  const { data, error } = await supabase.rpc("create_room", {
    p_name: "Sala de estudio",
    p_is_public: false,
    p_max_uses: null,
    p_expires_minutes: null,
  });
  if (error) throw error;
  return data[0].room_id;
}

// Se une a una sala por su código (RPC join_room) y devuelve el id de la sala
export async function unirseASala(codigo: string | null): Promise<string> {
  const { data, error } = await supabase.rpc("join_room", { p_code: codigo });
  if (error) throw error;
  return data as string;
}

// Asegura la membresía en una sala a la que se entra por su id/link directo (RPC
// join_room_by_id, idempotente). Necesario por el endurecimiento de RLS: sin la
// fila en `room_members` las lecturas/sincronizaciones de la sala fallan.
export async function unirseASalaPorId(salaId: string): Promise<void> {
  const { error } = await supabase.rpc("join_room_by_id", { p_room_id: salaId });
  if (error) throw error;
}

// Trae la invitación más reciente de una sala (o null si no hay)
export async function obtenerInvitacion(salaId: string): Promise<Invitacion | null> {
  const { data, error } = await supabase
    .from("room_invites")
    .select("code, expires_at, max_uses, uses, created_at")
    .eq("room_id", salaId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

// Trae el estado del reloj compartido de una sala (o null si no hay)
export async function obtenerEstadoReloj(salaId: string): Promise<EstadoReloj | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("timer_state")
    .eq("id", salaId)
    .maybeSingle();
  if (error) throw error;
  return (data?.timer_state as EstadoReloj | null) ?? null;
}

// Guarda/actualiza el estado del reloj compartido de una sala. Va por la RPC
// update_room_sync (SECURITY DEFINER, valida membresía): bajo el RLS endurecido
// el UPDATE directo a `rooms` está bloqueado para los clientes.
export async function guardarEstadoReloj(salaId: string, estado: EstadoReloj): Promise<void> {
  const { error } = await supabase.rpc("update_room_sync", { p_room_id: salaId, p_timer_state: estado });
  if (error) throw error;
}

// Trae el estado de la música compartida de una sala (columna `music_state`, o null si no hay)
export async function obtenerEstadoMusica(salaId: string): Promise<EstadoMusicaSala | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("music_state")
    .eq("id", salaId)
    .maybeSingle();
  if (error) throw error;
  return (data?.music_state as EstadoMusicaSala | null) ?? null;
}

// Guarda/actualiza el estado de la música compartida de una sala (vía
// update_room_sync, igual que el reloj: el UPDATE directo a `rooms` está bloqueado).
export async function guardarEstadoMusica(salaId: string, estado: unknown): Promise<void> {
  const { error } = await supabase.rpc("update_room_sync", { p_room_id: salaId, p_music_state: estado });
  if (error) throw error;
}

// --- Canal realtime compartido por sala -----------------------------------

// Fila de `rooms` que llega en el payload de un UPDATE en tiempo real
export interface FilaSala {
  timer_state?: EstadoReloj | null;
  music_state?: EstadoMusicaSala | null;
  [clave: string]: unknown;
}

type CambioSalaCallback = (fila: FilaSala) => void;

interface CanalCompartido {
  canal: RealtimeChannel;
  suscriptores: Set<CambioSalaCallback>;
}

// Un único canal `postgres_changes` por sala, con conteo de referencias: reloj y
// música comparten la misma suscripción a los UPDATE de `rooms` en vez de abrir dos
// canales separados sobre la misma fila.
const canalesPorSala = new Map<string, CanalCompartido>();

// Suscribe un callback a los cambios en tiempo real de la fila de una sala. Devuelve
// la función para desuscribirse (que cierra el canal cuando ya no queda nadie).
export function suscribirCambiosSala(salaId: string, callback: CambioSalaCallback): () => void {
  let compartido = canalesPorSala.get(salaId);

  if (!compartido) {
    const suscriptores = new Set<CambioSalaCallback>();
    const canal = supabase
      .channel(`realtime-room-${salaId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${salaId}` },
        (payload) => {
          if (payload.new) {
            // Copia defensiva de los suscriptores por si alguno se da de baja durante el reparto
            [...suscriptores].forEach((cb) => cb(payload.new as FilaSala));
          }
        }
      )
      .subscribe();
    compartido = { canal, suscriptores };
    canalesPorSala.set(salaId, compartido);
  }

  compartido.suscriptores.add(callback);

  return () => {
    const actual = canalesPorSala.get(salaId);
    if (!actual) return;
    actual.suscriptores.delete(callback);
    if (actual.suscriptores.size === 0) {
      supabase.removeChannel(actual.canal);
      canalesPorSala.delete(salaId);
    }
  };
}
