import { describe, expect, it, vi } from "vitest";
import { ordenarTareas } from "./useTareas";
import type { Tarea } from "@/types/dominio";

// `useTareas.ts` importa el cliente real de Supabase, que al cargarse exige las
// variables de entorno (VITE_SUPABASE_URL/ANON_KEY) que el CI no tiene. Este
// test no toca Supabase: lo reemplazamos por un stub vacío.
vi.mock("@/lib/supabase", () => ({ default: {} }));

// Fábrica mínima: solo los campos que afectan el orden + los obligatorios del tipo
function tarea(parcial: Partial<Tarea> & { id: number }): Tarea {
  return {
    header: "Tarea",
    type: "General",
    status: "Sin Empezar",
    ...parcial,
  } as Tarea;
}

describe("ordenarTareas", () => {
  it("ordena por order_index ascendente", () => {
    const resultado = ordenarTareas([
      tarea({ id: 2, order_index: 5 }),
      tarea({ id: 1, order_index: 1 }),
      tarea({ id: 3, order_index: 3 }),
    ]);
    expect(resultado.map((t) => t.id)).toEqual([1, 3, 2]);
  });

  it("manda los order_index null al final", () => {
    const resultado = ordenarTareas([
      tarea({ id: 1, order_index: null }),
      tarea({ id: 2, order_index: 0 }),
      tarea({ id: 3, order_index: null }),
      tarea({ id: 4, order_index: 2 }),
    ]);
    expect(resultado.slice(0, 2).map((t) => t.id)).toEqual([2, 4]);
    expect(resultado.slice(2).every((t) => t.order_index == null)).toBe(true);
  });

  it("desempata por created_at descendente (la más nueva primero)", () => {
    const resultado = ordenarTareas([
      tarea({ id: 1, order_index: 1, created_at: "2026-07-01T10:00:00Z" }),
      tarea({ id: 2, order_index: 1, created_at: "2026-07-10T10:00:00Z" }),
      tarea({ id: 3, order_index: null, created_at: "2026-07-01T10:00:00Z" }),
      tarea({ id: 4, order_index: null, created_at: "2026-07-10T10:00:00Z" }),
    ]);
    expect(resultado.map((t) => t.id)).toEqual([2, 1, 4, 3]);
  });

  it("no muta el array original", () => {
    const original = [tarea({ id: 2, order_index: 2 }), tarea({ id: 1, order_index: 1 })];
    const copia = [...original];
    ordenarTareas(original);
    expect(original).toEqual(copia);
  });
});
