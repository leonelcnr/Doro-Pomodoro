import { describe, expect, it } from "vitest";
import {
  avanceItem,
  estaTerminado,
  fraseFaltantes,
  itemsDelTema,
  puntosFaltantes,
  resumenPorTipo,
  sumarAvance,
} from "./avance";
import { agruparPorFecha, sumarDias, vencidas } from "./calendario";
import type { Tarea } from "@/types/dominio";

function item(parcial: Partial<Tarea> & { id: number }): Tarea {
  return { header: `Ítem ${parcial.id}`, type: "General", status: "Sin Empezar", ...parcial };
}

// Checklist con los puntos hechos indicados (números desde 1)
function puntos(total: number, hechos: number[]) {
  return Array.from({ length: total }, (_, i) => ({
    id: `p${i + 1}`,
    texto: "",
    hecho: hechos.includes(i + 1),
  }));
}

describe("avance", () => {
  it("un ítem sin checklist vale una unidad, hecha si está Completada", () => {
    expect(avanceItem(item({ id: 1 }))).toEqual({ hechos: 0, total: 1 });
    expect(avanceItem(item({ id: 2, status: "Completada" }))).toEqual({ hechos: 1, total: 1 });
  });

  it("con checklist cuenta los ítems hechos", () => {
    const tp = item({ id: 1, kind: "practico", checklist: puntos(13, [1, 2, 9, 10, 13]) });
    expect(avanceItem(tp)).toEqual({ hechos: 5, total: 13 });
    expect(estaTerminado(tp)).toBe(false);
    expect(estaTerminado({ ...tp, checklist: puntos(3, [1, 2, 3]) })).toBe(true);
  });

  it("suma por unidades, no por ítems", () => {
    const tareas = [
      item({ id: 1, checklist: puntos(4, [1, 2]) }),
      item({ id: 2, status: "Completada" }),
    ];
    expect(sumarAvance(tareas)).toEqual({ hechos: 3, total: 5 });
  });

  it("resume por tipo en orden fijo y omite los tipos vacíos", () => {
    const tareas = [
      item({ id: 1, kind: "tarea", status: "Completada" }),
      item({ id: 2 }), // sin kind = tarea
      item({ id: 3, kind: "parcial", checklist: puntos(2, [1]) }),
    ];
    const resumen = resumenPorTipo(tareas);
    expect(resumen.map((r) => r.tipo)).toEqual(["parcial", "tarea"]);
    expect(resumen[1]).toMatchObject({ cantidad: 2, pendientes: 1, hechos: 1, total: 2 });
  });

  it("filtra por tema, con null como «General»", () => {
    const tareas = [item({ id: 1, topic_id: "a" }), item({ id: 2, topic_id: null }), item({ id: 3 })];
    expect(itemsDelTema(tareas, "a").map((t) => t.id)).toEqual([1]);
    expect(itemsDelTema(tareas, null).map((t) => t.id)).toEqual([2, 3]);
  });
});

describe("puntos que faltan", () => {
  it("agrupa en rangos", () => {
    const tp = item({ id: 1, checklist: puntos(13, [1, 2, 9, 10, 13]) });
    expect(puntosFaltantes(tp)).toEqual([[3, 8], [11, 12]]);
    expect(fraseFaltantes(tp)).toBe("Faltan los puntos 3 a 8, 11 y 12");
  });

  it("singular, un par suelto y nada", () => {
    expect(fraseFaltantes(item({ id: 1, checklist: puntos(5, [1, 2, 3, 5]) }))).toBe(
      "Falta el punto 4"
    );
    expect(fraseFaltantes(item({ id: 2, checklist: puntos(5, [1, 4, 5]) }))).toBe(
      "Faltan los puntos 2 y 3"
    );
    expect(fraseFaltantes(item({ id: 3, checklist: puntos(2, [1, 2]) }))).toBeNull();
  });
});

describe("calendario", () => {
  const tareas = [
    item({ id: 1, header: "B", due_date: "2026-10-10" }),
    item({ id: 2, header: "A", due_date: "2026-10-10", due_time: "18:00:00" }),
    item({ id: 3, due_date: "2026-11-02" }),
    item({ id: 4, due_date: "2026-10-01", status: "Completada" }),
    item({ id: 5, due_date: "2026-10-02" }),
    item({ id: 6 }),
  ];

  it("agrupa por día dentro del rango, con hora primero", () => {
    const porDia = agruparPorFecha(tareas, "2026-10-01", "2026-10-31");
    expect([...porDia.keys()]).toEqual(["2026-10-01", "2026-10-02", "2026-10-10"]);
    expect(porDia.get("2026-10-10")!.map((t) => t.id)).toEqual([2, 1]);
  });

  it("vencidas: antes de hoy y sin terminar", () => {
    expect(vencidas(tareas, "2026-10-05", estaTerminado).map((t) => t.id)).toEqual([5]);
  });

  it("suma días cruzando el mes", () => {
    expect(sumarDias("2026-10-30", 3)).toBe("2026-11-02");
    expect(sumarDias("2026-03-01", -1)).toBe("2026-02-28");
  });
});
