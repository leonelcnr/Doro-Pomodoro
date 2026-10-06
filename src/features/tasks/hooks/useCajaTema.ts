import { useMemo } from "react";
import {
  estaTerminado,
  fraccion,
  itemsDelTema,
  resumenPorTipo,
  sumarAvance,
  tipoDe,
} from "@/features/tasks/avance";
import type { Tarea, Tema, TipoItem } from "@/types/dominio";

/**
 * Datos de la caja abierta de un tema (S2): avance del tema, los recuadros por
 * tipo y las tarjetas del tipo elegido (primero lo pendiente).
 *
 * Recibe las tareas personales ya cargadas (`useTareas()`) y los temas
 * (`useTemas()`): no consulta nada por su cuenta. `temaId = null` es «General».
 * Si `tipoElegido` no tiene ítems en el tema, se usa el primer tipo que tenga.
 */
export function useCajaTema(
  tareas: Tarea[],
  temas: Tema[],
  temaId: string | null,
  tipoElegido?: TipoItem
) {
  return useMemo(() => {
    const items = itemsDelTema(tareas, temaId);
    const recuadros = resumenPorTipo(items);
    const tipo = recuadros.some((r) => r.tipo === tipoElegido)
      ? tipoElegido!
      : recuadros[0]?.tipo;
    const tarjetas = items
      .filter((t) => tipoDe(t) === tipo)
      .sort(
        (a, b) =>
          Number(estaTerminado(a)) - Number(estaTerminado(b)) ||
          (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999")
      );
    const avance = sumarAvance(items);
    return {
      tema: temas.find((t) => t.id === temaId) ?? null,
      avance,
      porcentaje: Math.round(fraccion(avance) * 100),
      pendientes: items.filter((t) => !estaTerminado(t)).length,
      recuadros,
      tipo,
      tarjetas,
    };
  }, [tareas, temas, temaId, tipoElegido]);
}

/**
 * Avance de cada tema para la grilla de cajas y el menú del nombre, más la
 * caja «General» si hay ítems sin tema. Mismo orden que `temas`.
 */
export function useAvancePorTema(tareas: Tarea[], temas: Tema[]) {
  return useMemo(() => {
    const filas = temas.map((tema) => {
      const items = itemsDelTema(tareas, tema.id);
      const avance = sumarAvance(items);
      return {
        temaId: tema.id as string | null,
        avance,
        porcentaje: Math.round(fraccion(avance) * 100),
        pendientes: items.filter((t) => !estaTerminado(t)).length,
      };
    });
    const sinTema = itemsDelTema(tareas, null);
    if (sinTema.length > 0) {
      const avance = sumarAvance(sinTema);
      filas.push({
        temaId: null,
        avance,
        porcentaje: Math.round(fraccion(avance) * 100),
        pendientes: sinTema.filter((t) => !estaTerminado(t)).length,
      });
    }
    const general = sumarAvance(tareas);
    return {
      porTema: filas,
      general,
      porcentajeGeneral: Math.round(fraccion(general) * 100),
      pendientes: tareas.filter((t) => !estaTerminado(t)).length,
    };
  }, [tareas, temas]);
}
