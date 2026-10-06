import { useMemo } from "react";
import { estaTerminado, itemsDelTema } from "@/features/tasks/avance";
import { agruparPorFecha, fechaLocalISO, vencidas } from "@/features/tasks/calendario";
import type { Tarea } from "@/types/dominio";

interface OpcionesCalendario {
  desde: string;             // "2026-10-01"
  hasta: string;             // "2026-10-31"
  /** Solo un tema (`null` = «General»); sin definir = todos. */
  temaId?: string | null | undefined;
  /** Para tests; por defecto, hoy en hora local. */
  hoy?: string | undefined;
}

/**
 * Vista «Calendario» de Tareas: los ítems con fecha del rango, por día, y lo
 * vencido sin terminar (para mostrarlo arriba aunque quede fuera del rango).
 * Recibe las tareas ya cargadas por `useTareas()`.
 */
export function useCalendarioTareas(tareas: Tarea[], opciones: OpcionesCalendario) {
  const { desde, hasta, temaId, hoy: hoyFijo } = opciones;
  return useMemo(() => {
    const hoy = hoyFijo ?? fechaLocalISO(new Date());
    const items = temaId === undefined ? tareas : itemsDelTema(tareas, temaId);
    return {
      hoy,
      porDia: agruparPorFecha(items, desde, hasta),
      vencidas: vencidas(items, hoy, estaTerminado),
    };
  }, [tareas, desde, hasta, temaId, hoyFijo]);
}
