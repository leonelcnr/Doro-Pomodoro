import { describe, expect, it } from "vitest";
import { esUuid } from "./uuid";

describe("esUuid", () => {
  it("acepta un UUID canónico en minúsculas", () => {
    expect(esUuid("123e4567-e89b-12d3-a456-426614174000")).toBe(true);
  });

  it("acepta un UUID en mayúsculas (case-insensitive)", () => {
    expect(esUuid("123E4567-E89B-12D3-A456-426614174000")).toBe(true);
  });

  it("rechaza valores que no son string", () => {
    expect(esUuid(null)).toBe(false);
    expect(esUuid(undefined)).toBe(false);
    expect(esUuid(42)).toBe(false);
    expect(esUuid({})).toBe(false);
  });

  it("rechaza el string vacío y malformados", () => {
    expect(esUuid("")).toBe(false);
    expect(esUuid("no-es-un-uuid")).toBe(false);
    expect(esUuid("123e4567e89b12d3a456426614174000")).toBe(false); // sin guiones
    expect(esUuid("123e4567-e89b-12d3-a456-42661417400")).toBe(false); // un char menos
    expect(esUuid("123e4567-e89b-12d3-a456-4266141740000")).toBe(false); // un char más
    expect(esUuid("g23e4567-e89b-12d3-a456-426614174000")).toBe(false); // hex inválido
  });

  it("rechaza un UUID embebido en un string más largo", () => {
    expect(esUuid("x123e4567-e89b-12d3-a456-426614174000")).toBe(false);
    expect(esUuid("123e4567-e89b-12d3-a456-426614174000\nmalicia")).toBe(false);
  });
});
