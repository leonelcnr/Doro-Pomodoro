import { describe, expect, it, vi } from "vitest";
import { esEstadoRelojValido } from "./salasService";
import type { EstadoReloj } from "@/types/dominio";

// `salasService.ts` importa el cliente real de Supabase, que al cargarse exige las
// variables de entorno (VITE_SUPABASE_URL/ANON_KEY) que el CI no tiene. Este test
// solo ejercita el guard puro: reemplazamos el cliente por un stub vacío.
vi.mock("@/lib/supabase", () => ({ default: {} }));

const valido: EstadoReloj = {
  modo: "pomodoro",
  tiempoRestante: 1500,
  estaActivo: false,
  configuracion: { pomodoro: 25, shortBreak: 5, longBreak: 15, autoBreak: false },
  actualizadoEn: "2026-09-01T03:41:04.425Z",
};

describe("esEstadoRelojValido", () => {
  it("acepta un estado completo", () => {
    expect(esEstadoRelojValido(valido)).toBe(true);
  });

  it("acepta un estado sin los campos opcionales (filas viejas sin configuración)", () => {
    expect(esEstadoRelojValido({ modo: "shortBreak", tiempoRestante: 300, estaActivo: true })).toBe(true);
  });

  it("acepta los cuatro modos, incluido el cronómetro en 0", () => {
    for (const modo of ["pomodoro", "shortBreak", "longBreak", "stopwatch"]) {
      expect(esEstadoRelojValido({ modo, tiempoRestante: 0, estaActivo: false })).toBe(true);
    }
  });

  // El caso que dejaba las salas nuevas en 00:00: el default histórico de la
  // columna `timer_state` usa las claves en inglés previas a la traducción.
  it("rechaza el default legacy de la columna (claves en inglés)", () => {
    expect(esEstadoRelojValido({ mode: "pomodoro", isActive: false, timeLeft: 1500, updatedAt: null })).toBe(false);
  });

  it("rechaza valores que no son objetos", () => {
    expect(esEstadoRelojValido(null)).toBe(false);
    expect(esEstadoRelojValido(undefined)).toBe(false);
    expect(esEstadoRelojValido("pomodoro")).toBe(false);
    expect(esEstadoRelojValido(1500)).toBe(false);
  });

  it("rechaza un modo desconocido", () => {
    expect(esEstadoRelojValido({ modo: "siesta", tiempoRestante: 1500, estaActivo: false })).toBe(false);
    expect(esEstadoRelojValido({ tiempoRestante: 1500, estaActivo: false })).toBe(false);
  });

  it("rechaza un tiempoRestante que no sea un número finito y acotado", () => {
    const base = { modo: "pomodoro", estaActivo: false };
    expect(esEstadoRelojValido({ ...base, tiempoRestante: NaN })).toBe(false);
    expect(esEstadoRelojValido({ ...base, tiempoRestante: Infinity })).toBe(false);
    expect(esEstadoRelojValido({ ...base, tiempoRestante: -1 })).toBe(false);
    expect(esEstadoRelojValido({ ...base, tiempoRestante: "1500" })).toBe(false);
    expect(esEstadoRelojValido({ ...base })).toBe(false);
    // Por encima del tope de cordura (24 h), síntoma de un cronómetro corrupto
    expect(esEstadoRelojValido({ ...base, tiempoRestante: 24 * 60 * 60 + 1 })).toBe(false);
    expect(esEstadoRelojValido({ ...base, tiempoRestante: 24 * 60 * 60 })).toBe(true);
  });

  it("rechaza un estaActivo que no sea booleano", () => {
    expect(esEstadoRelojValido({ modo: "pomodoro", tiempoRestante: 1500, estaActivo: "false" })).toBe(false);
    expect(esEstadoRelojValido({ modo: "pomodoro", tiempoRestante: 1500 })).toBe(false);
  });
});
