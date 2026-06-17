import supabase from "@/lib/supabase";

// Estructura del evento que viaja hacia la Edge Function `sync-calendar`.
// Los nombres (summary, description, date) corresponden al contrato de Google
// Calendar / de la función, por eso se mantienen en inglés.
interface GCalEventPayload {
  summary: string;
  description?: string;
  /** Fecha ISO "YYYY-MM-DD" */
  date: string;
}

/**
 * Capa de servicio que delega en la Edge Function `sync-calendar` para
 * reflejar los eventos en el Google Calendar del usuario.
 */

/** Crea un evento nuevo en Google Calendar. Devuelve el ID del evento de Google. */
export async function gcalCreate(
  datos: GCalEventPayload
): Promise<string> {
  const { data, error } = await supabase.functions.invoke("sync-calendar", {
    body: { action: "CREATE", payload: datos },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.data.id as string;
}

/** Actualiza un evento existente de Google Calendar por su ID de Google. */
export async function gcalUpdate(
  googleEventId: string,
  datos: GCalEventPayload
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("sync-calendar", {
    body: { action: "UPDATE", payload: datos, googleEventId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}

/** Elimina un evento de Google Calendar por su ID de Google. */
export async function gcalDelete(
  googleEventId: string
): Promise<void> {
  const { data, error } = await supabase.functions.invoke("sync-calendar", {
    body: { action: "DELETE", googleEventId },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
}
