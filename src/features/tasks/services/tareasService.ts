import supabase from "@/lib/supabase";
import type { Tarea, TareaPayload } from "@/types/dominio";

/**
 * Capa de servicio para la tabla `tasks` de Supabase.
 *
 * Centraliza TODAS las operaciones de datos sobre tareas que antes estaban
 * embebidas en los componentes (`Home` y `RoomPage`). Cada función lanza el
 * error de Supabase si algo falla, dejando que el llamador decida cómo reaccionar.
 *
 * Las filas se tipan con el modelo de dominio `Tarea`; las cargas útiles de
 * alta/edición usan `TareaPayload` (subconjunto, sin `id` para las nuevas).
 */

// Trae las tareas de una sala: las de la sala MÁS las personales del usuario (sin sala)
export async function obtenerTareasDeSala(salaId: string, usuarioId: string): Promise<Tarea[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .or(`room_id.eq.${salaId},and(room_id.is.null,user_id.eq.${usuarioId})`)
    .order("order_index", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Tarea[];
}

// Trae solo las tareas personales (sin sala) del usuario
export async function obtenerTareasPersonales(usuarioId: string): Promise<Tarea[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", usuarioId)
    .is("room_id", null)
    .order("order_index", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Tarea[];
}

// Elimina varias tareas por sus ids (no hace nada si la lista está vacía)
export async function eliminarTareas(ids: (string | number)[]): Promise<void> {
  if (ids.length === 0) return;
  const { error } = await supabase.from("tasks").delete().in("id", ids);
  if (error) throw error;
}

// Actualiza una tarea existente por su id
export async function actualizarTarea(id: string | number, datos: TareaPayload): Promise<void> {
  const { error } = await supabase.from("tasks").update(datos).eq("id", id);
  if (error) throw error;
}

// Inserta nuevas tareas (no hace nada si la lista está vacía)
export async function insertarTareas(datos: TareaPayload[]): Promise<void> {
  if (datos.length === 0) return;
  const { error } = await supabase.from("tasks").insert(datos);
  if (error) throw error;
}

// Inserta o actualiza tareas en lote (upsert; no hace nada si la lista está vacía)
export async function upsertTareas(datos: TareaPayload[]): Promise<void> {
  if (datos.length === 0) return;
  const { error } = await supabase.from("tasks").upsert(datos);
  if (error) throw error;
}

// Mueve una tarea entre el ámbito personal y el de una sala (alterna su room_id)
export async function moverTarea(id: string | number, nuevaSalaId: string | null): Promise<void> {
  const { error } = await supabase.from("tasks").update({ room_id: nuevaSalaId }).eq("id", id);
  if (error) throw error;
}
