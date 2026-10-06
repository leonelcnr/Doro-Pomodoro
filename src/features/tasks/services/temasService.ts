import supabase from "@/lib/supabase";
import type { Tema, TemaPayload } from "@/types/dominio";

/**
 * Capa de servicio para la tabla `topics` (los temas de cada usuario).
 *
 * La RLS solo deja ver y tocar los temas propios. Borrar un tema no borra sus
 * tareas: la FK las deja con `topic_id` en null («General»).
 * Cada función lanza el error de Supabase si algo falla.
 */

// Temas del usuario en su orden manual (y por alta, a igualdad)
export async function obtenerTemas(usuarioId: string): Promise<Tema[]> {
  const { data, error } = await supabase
    .from("topics")
    .select("*")
    .eq("user_id", usuarioId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Tema[];
}

// Crea un tema y devuelve la fila real. Un nombre repetido (sin importar
// mayúsculas ni espacios) choca con el índice `topics_nombre_unico`.
export async function crearTema(
  usuarioId: string,
  datos: TemaPayload & { name: string }
): Promise<Tema> {
  const { data, error } = await supabase
    .from("topics")
    .insert({ ...datos, user_id: usuarioId })
    .select()
    .single();
  if (error) throw error;
  return data as Tema;
}

// Cambia nombre, ícono u orden de un tema
export async function actualizarTema(id: string, datos: TemaPayload): Promise<void> {
  const { error } = await supabase.from("topics").update(datos).eq("id", id);
  if (error) throw error;
}

// Guarda el orden manual: `position` = índice en la lista recibida
export async function reordenarTemas(idsEnOrden: string[]): Promise<void> {
  const resultados = await Promise.all(
    idsEnOrden.map((id, position) =>
      supabase.from("topics").update({ position }).eq("id", id)
    )
  );
  const conError = resultados.find((r) => r.error);
  if (conError?.error) throw conError.error;
}

// Borra un tema; sus tareas quedan en «General»
export async function eliminarTema(id: string): Promise<void> {
  const { error } = await supabase.from("topics").delete().eq("id", id);
  if (error) throw error;
}

/** ¿El error es el del nombre de tema repetido? (violación de unicidad) */
export function esNombreRepetido(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}
