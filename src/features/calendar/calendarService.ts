import supabase from "@/lib/supabase";

// Tipos de evento del calendario. Los valores se almacenan tal cual en la columna `type`.
export type EventType = "Examen" | "Entrega" | "Estudio" | "Otro";

// Estructura de un evento del calendario. Los nombres de campos coinciden con las
// columnas de la tabla `calendar_events` en Supabase, por eso van en inglés.
export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string; // Fecha ISO "YYYY-MM-DD"
  type: EventType;
  description?: string;
  google_event_id?: string;
  created_at: string;
  updated_at: string;
}

// Datos necesarios para crear un evento (el resto los completa la base de datos)
export interface CreateEventPayload {
  title: string;
  event_date: string;
  type: EventType;
  description?: string;
}

// Datos opcionales para actualizar un evento existente
export interface UpdateEventPayload {
  title?: string;
  event_date?: string;
  type?: EventType;
  description?: string;
  google_event_id?: string;
}

// --- Capa de servicio: acceso a la tabla `calendar_events` de Supabase ---

// Trae todos los eventos del usuario, ordenados por fecha ascendente
export async function fetchEvents(): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .order("event_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// Crea un evento asociándolo al usuario autenticado actual
export async function createEvent(
  datos: CreateEventPayload
): Promise<CalendarEvent> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado.");

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({ ...datos, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Actualiza un evento por su id y devuelve la fila actualizada
export async function updateEvent(
  id: string,
  datos: UpdateEventPayload
): Promise<CalendarEvent> {
  const { data, error } = await supabase
    .from("calendar_events")
    .update(datos)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// Elimina un evento por su id
export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
