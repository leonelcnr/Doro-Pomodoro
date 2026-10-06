// Cuentas de avance de la pantalla de Tareas (S2): por ítem, por tipo y por tema.
//
// El avance vive en el `checklist` (ver docs/rediseno/tareas-datos.md):
//  - práctico: un ítem por punto (el número es la posición)
//  - informe:  un ítem por parte, con su nombre
//  - parcial:  un ítem por unidad; `hecho` = repasada
//  - tarea:    sus subtareas
// Un ítem sin checklist cuenta como una sola unidad, hecha si está «Completada».

import { normalizarEstado } from "@/features/tasks/atributos";
import type { Tarea, TipoItem } from "@/types/dominio";

export const TIPOS_ITEM: TipoItem[] = ["parcial", "practico", "informe", "tarea"];

export interface Avance {
  hechos: number;
  total: number;
}

export function tipoDe(tarea: Tarea): TipoItem {
  return tarea.kind ?? "tarea";
}

export function avanceItem(tarea: Tarea): Avance {
  const lista = tarea.checklist ?? [];
  if (lista.length > 0) {
    return { hechos: lista.filter((i) => i.hecho).length, total: lista.length };
  }
  return { hechos: normalizarEstado(tarea.status) === "Completada" ? 1 : 0, total: 1 };
}

/** Terminado: marcado como «Completada» o con todo el checklist hecho. */
export function estaTerminado(tarea: Tarea): boolean {
  const { hechos, total } = avanceItem(tarea);
  return normalizarEstado(tarea.status) === "Completada" || hechos === total;
}

export function sumarAvance(tareas: Tarea[]): Avance {
  return tareas.reduce<Avance>(
    (acc, t) => {
      const a = avanceItem(t);
      return { hechos: acc.hechos + a.hechos, total: acc.total + a.total };
    },
    { hechos: 0, total: 0 }
  );
}

/** 0 a 1; sin nada que hacer cuenta como completo. */
export function fraccion({ hechos, total }: Avance): number {
  return total === 0 ? 1 : hechos / total;
}

/** Ítems de un tema; `null` = «General» (sin tema). */
export function itemsDelTema(tareas: Tarea[], temaId: string | null): Tarea[] {
  return tareas.filter((t) => (t.topic_id ?? null) === temaId);
}

export interface ResumenTipo extends Avance {
  tipo: TipoItem;
  cantidad: number;
  pendientes: number;
}

/** Un recuadro por tipo con ítems (en el orden de `TIPOS_ITEM`). */
export function resumenPorTipo(tareas: Tarea[]): ResumenTipo[] {
  return TIPOS_ITEM.map((tipo) => {
    const delTipo = tareas.filter((t) => tipoDe(t) === tipo);
    return {
      tipo,
      cantidad: delTipo.length,
      pendientes: delTipo.filter((t) => !estaTerminado(t)).length,
      ...sumarAvance(delTipo),
    };
  }).filter((r) => r.cantidad > 0);
}

/**
 * Números (desde 1) de los puntos sin hacer, agrupados en rangos:
 * [[3, 8], [11, 12]] para «Faltan los puntos 3 a 8, 11 y 12».
 */
export function puntosFaltantes(tarea: Tarea): [number, number][] {
  const rangos: [number, number][] = [];
  (tarea.checklist ?? []).forEach((item, i) => {
    if (item.hecho) return;
    const numero = i + 1;
    const ultimo = rangos[rangos.length - 1];
    if (ultimo && ultimo[1] === numero - 1) ultimo[1] = numero;
    else rangos.push([numero, numero]);
  });
  return rangos;
}

/** «Faltan los puntos 3 a 8, 11 y 12» · «Falta el punto 4» · null si no falta nada. */
export function fraseFaltantes(tarea: Tarea): string | null {
  const rangos = puntosFaltantes(tarea);
  if (rangos.length === 0) return null;
  const [primero] = rangos;
  if (rangos.length === 1 && primero && primero[0] === primero[1]) {
    return `Falta el punto ${primero[0]}`;
  }
  // Dos seguidos van sueltos («11 y 12»); tres o más, como rango («3 a 8»)
  const partes = rangos.flatMap(([a, b]) =>
    a === b ? [`${a}`] : b === a + 1 ? [`${a}`, `${b}`] : [`${a} a ${b}`]
  );
  const ultima = partes.pop()!;
  const texto = partes.length ? `${partes.join(", ")} y ${ultima}` : ultima;
  return `Faltan los puntos ${texto}`;
}
