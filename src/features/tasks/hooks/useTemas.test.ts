import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useTemas } from "./useTemas";
import * as temasService from "@/features/tasks/services/temasService";
import { reiniciarCanalesFalsos, ultimoCanal } from "@/test/canalFalso";
import type { Tema } from "@/types/dominio";

vi.mock("@/lib/supabase", async () => ({
  default: (await import("@/test/canalFalso")).clienteSupabaseFalso,
}));

vi.mock("@/features/tasks/services/temasService", () => ({
  obtenerTemas: vi.fn(),
  crearTema: vi.fn(),
  actualizarTema: vi.fn(),
  reordenarTemas: vi.fn(),
  eliminarTema: vi.fn(),
}));

vi.mock("@/features/auth/context/useAuth", () => {
  const usuarioEstable = { id: "usuario-1" };
  return { useAuth: () => ({ user: usuarioEstable }) };
});

function tema(id: string, position: number): Tema {
  return {
    id,
    user_id: "usuario-1",
    name: `Tema ${id}`,
    icon: "libro",
    position,
    created_at: `2026-10-0${position + 1}T00:00:00Z`,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  reiniciarCanalesFalsos();
  vi.mocked(temasService.obtenerTemas).mockResolvedValue([tema("a", 0), tema("b", 1)]);
});

async function montar() {
  const hook = renderHook(() => useTemas());
  await waitFor(() => expect(hook.result.current.cargado).toBe(true));
  return hook;
}

describe("useTemas", () => {
  it("carga los temas del usuario", async () => {
    const { result } = await montar();
    expect(temasService.obtenerTemas).toHaveBeenCalledWith("usuario-1");
    expect(result.current.temas.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("crea al final y no duplica si el eco llegó antes", async () => {
    const nuevo = tema("c", 2);
    vi.mocked(temasService.crearTema).mockImplementation(async () => {
      ultimoCanal().emitir({ eventType: "INSERT", new: nuevo, old: {} });
      return nuevo;
    });
    const { result } = await montar();
    await act(() => result.current.crearTema("  Redes  ", "red"));
    expect(temasService.crearTema).toHaveBeenCalledWith("usuario-1", {
      name: "Redes",
      position: 2,
      icon: "red",
    });
    expect(result.current.temas.map((t) => t.id)).toEqual(["a", "b", "c"]);
  });

  it("reordena con optimismo y vuelve atrás si falla", async () => {
    vi.mocked(temasService.reordenarTemas).mockRejectedValue(new Error("red caída"));
    const { result } = await montar();
    let promesa!: Promise<void>;
    act(() => {
      promesa = result.current.reordenarTemas(["b", "a"]);
    });
    expect(result.current.temas.map((t) => t.id)).toEqual(["b", "a"]);
    await act(() => expect(promesa).rejects.toThrow("red caída"));
    expect(result.current.temas.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("aplica cambios y borrados del realtime", async () => {
    const { result } = await montar();
    act(() => {
      ultimoCanal().emitir({ eventType: "UPDATE", new: { ...tema("a", 5), name: "Otro" }, old: {} });
    });
    expect(result.current.temas.map((t) => t.name)).toEqual(["Tema b", "Otro"]);
    act(() => {
      ultimoCanal().emitir({ eventType: "DELETE", new: {}, old: { id: "b" } });
    });
    expect(result.current.temas.map((t) => t.id)).toEqual(["a"]);
  });

  it("borra con optimismo", async () => {
    vi.mocked(temasService.eliminarTema).mockResolvedValue();
    const { result } = await montar();
    await act(() => result.current.eliminarTema("a"));
    expect(result.current.temas.map((t) => t.id)).toEqual(["b"]);
  });
});
