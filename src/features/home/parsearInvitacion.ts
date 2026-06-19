// src/features/home/parsearInvitacion.ts
/**
 * Normaliza lo que el usuario pega para unirse a una sala: acepta tanto una URL
 * completa de invitación (/invite/XXXX) como el código suelto, y devuelve el
 * código en mayúsculas, o null si no parece válido.
 */
export function parsearInvitacion(input: string): string | null {
  const crudo = input.trim();

  // Caso: pegó una URL con la forma /invite/XXXX
  const coincidencia = crudo.match(/\/invite\/([a-z0-9]+)/i);
  if (coincidencia?.[1]) return coincidencia[1].toUpperCase();

  // Caso: pegó solo el código
  const codigo = crudo.replace(/\s+/g, "").toUpperCase();
  if (codigo.length < 4) return null; // regla mínima de longitud
  return codigo;
}
