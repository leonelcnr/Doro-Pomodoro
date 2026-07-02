/**
 * Validación de UUID para los identificadores que llegan desde fuentes no
 * confiables (parámetros de la URL). Los ids de sala se interpolan en el filtro
 * de realtime (`id=eq.${salaId}`) y en el nombre del canal, así que conviene
 * rechazar cualquier valor malformado en el borde antes de tocar Supabase.
 */

// Acepta el formato canónico de UUID (8-4-4-4-12 hex), sin fijar versión/variante.
const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Devuelve `true` si `valor` tiene forma de UUID canónico. */
export function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" && PATRON_UUID.test(valor);
}
