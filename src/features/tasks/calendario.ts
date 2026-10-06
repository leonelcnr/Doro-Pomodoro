// Vista «Calendario» de Tareas: agrupa por día lo que tiene fecha.
//
// Las fechas son strings ISO ("2026-10-10"), como en la base: se comparan como
// texto y no se pasan por `Date`, así no se corren de día por la zona horaria.

import type { Tarea } from "@/types/dominio";

/** "2026-10-05" de una fecha local (no UTC). */
export function fechaLocalISO(fecha: Date): string {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

/** Suma días a una fecha ISO y devuelve otra fecha ISO. */
export function sumarDias(fechaISO: string, dias: number): string {
  const [a, m, d] = fechaISO.split("-").map(Number);
  return fechaLocalISO(new Date(a!, m! - 1, d! + dias));
}

/**
 * Ítems con fecha entre `desde` y `hasta` (inclusive), por día. Cada día viene
 * ordenado por hora (los sin hora al final) y después por título.
 */
export function agruparPorFecha(
  tareas: Tarea[],
  desde: string,
  hasta: string
): Map<string, Tarea[]> {
  const porDia = new Map<string, Tarea[]>();
  for (const t of tareas) {
    const dia = t.due_date;
    if (!dia || dia < desde || dia > hasta) continue;
    const lista = porDia.get(dia);
    if (lista) lista.push(t);
    else porDia.set(dia, [t]);
  }
  for (const lista of porDia.values()) {
    lista.sort(
      (a, b) =>
        (a.due_time ?? "99").localeCompare(b.due_time ?? "99") ||
        a.header.localeCompare(b.header)
    );
  }
  return new Map([...porDia.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

/** Lo que tiene fecha anterior a `hoy` y no está terminado. */
export function vencidas(
  tareas: Tarea[],
  hoy: string,
  estaTerminado: (t: Tarea) => boolean
): Tarea[] {
  return tareas.filter((t) => !!t.due_date && t.due_date < hoy && !estaTerminado(t));
}
