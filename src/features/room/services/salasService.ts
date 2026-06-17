import supabase from "@/lib/supabase";

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

// Trae la invitación más reciente de una sala (o null si no hay)
export async function obtenerInvitacion(salaId: string): Promise<any | null> {
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
export async function obtenerEstadoReloj(salaId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select("timer_state")
    .eq("id", salaId)
    .maybeSingle();
  if (error) throw error;
  return data?.timer_state ?? null;
}

// Guarda/actualiza el estado del reloj compartido de una sala
export async function guardarEstadoReloj(salaId: string, estado: unknown): Promise<void> {
  const { error } = await supabase.from("rooms").update({ timer_state: estado }).eq("id", salaId);
  if (error) throw error;
}
