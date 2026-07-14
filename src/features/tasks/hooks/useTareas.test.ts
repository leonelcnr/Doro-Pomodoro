import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useTareas } from "./useTareas";
import * as tareasService from "@/features/tasks/services/tareasService";
import {
  clienteSupabaseFalso,
  reiniciarCanalesFalsos,
  ultimoCanal,
} from "@/test/canalFalso";
import { diferido } from "@/test/diferido";
import type { Tarea } from "@/types/dominio";

vi.mock("@/lib/supabase", async () => ({
  default: (await import("@/test/canalFalso")).clienteSupabaseFalso,
}));

vi.mock("@/features/tasks/services/tareasService", () => ({
  obtenerTareasDeSala: vi.fn(),
  obtenerTareasPersonales: vi.fn(),
  crearTarea: vi.fn(),
  obtenerCategorias: vi.fn(),
  eliminarTareas: vi.fn(),
  actualizarTarea: vi.fn(),
  insertarTareas: vi.fn(),
  upsertTareas: vi.fn(),
  moverTarea: vi.fn(),
}));

const USUARIO = { id: "usuario-1" };
vi.mock("@/features/auth/context/useAuth", () => {
  // Referencia ESTABLE entre renders (como el contexto real): si `user` fuera un
  // objeto nuevo por render, el efecto del hook se re-suscribiría en cada render.
  const usuarioEstable = { id: "usuario-1" };
  return { useAuth: () => ({ user: usuarioEstable }) };
});

const SALA = "11111111-2222-3333-4444-555555555555";

function tarea(parcial: Partial<Tarea> & { id: number }): Tarea {
  return {
    header: `Tarea ${parcial.id}`,
    type: "General",
    status: "Sin Empezar",
    user_id: USUARIO.id,
    room_id: null,
    ...parcial,
  } as Tarea;
}

// Payloads realtime con la forma mínima que consume aplicarCambioRealtime
function payloadInsert(fila: Tarea) {
  return { eventType: "INSERT", new: fila, old: {} };
}
function payloadUpdate(fila: Tarea) {
  return { eventType: "UPDATE", new: fila, old: {} };
}
function payloadDelete(id: number) {
  return { eventType: "DELETE", new: {}, old: { id } };
}

beforeEach(() => {
  vi.clearAllMocks();
  reiniciarCanalesFalsos();
  vi.mocked(tareasService.obtenerTareasPersonales).mockResolvedValue([]);
  vi.mocked(tareasService.obtenerTareasDeSala).mockResolvedValue([]);
});

describe("useTareas · carga inicial", () => {
  it("sin salaId trae las personales y marca cargado", async () => {
    const personales = [tarea({ id: 1 }), tarea({ id: 2 })];
    vi.mocked(tareasService.obtenerTareasPersonales).mockResolvedValue(personales);

    const { result } = renderHook(() => useTareas());

    await waitFor(() => expect(result.current.cargado).toBe(true));
    expect(tareasService.obtenerTareasPersonales).toHaveBeenCalledWith(USUARIO.id);
    expect(tareasService.obtenerTareasDeSala).not.toHaveBeenCalled();
    expect(result.current.tareas).toEqual(personales);
  });

  it("con salaId trae sala+personales y se suscribe a ambos filtros", async () => {
    const deSala = [tarea({ id: 3, room_id: SALA, user_id: "otro" })];
    vi.mocked(tareasService.obtenerTareasDeSala).mockResolvedValue(deSala);

    const { result } = renderHook(() => useTareas(SALA));

    await waitFor(() => expect(result.current.cargado).toBe(true));
    expect(tareasService.obtenerTareasDeSala).toHaveBeenCalledWith(SALA, USUARIO.id);
    expect(result.current.tareas).toEqual(deSala);
    // Un handler por el filtro de sala y otro por el de usuario
    expect(ultimoCanal().manejadores).toHaveLength(2);
  });

  it("al desmontar remueve el canal", async () => {
    const { unmount } = renderHook(() => useTareas());
    await waitFor(() => expect(ultimoCanal().manejadores.length).toBeGreaterThan(0));

    unmount();

    expect(clienteSupabaseFalso.removeChannel).toHaveBeenCalledTimes(1);
  });
});

describe("useTareas · merge incremental realtime", () => {
  it("INSERT agrega respetando el orden (order_index ascendente)", async () => {
    vi.mocked(tareasService.obtenerTareasPersonales).mockResolvedValue([
      tarea({ id: 1, order_index: 0 }),
      tarea({ id: 2, order_index: 2 }),
    ]);
    const { result } = renderHook(() => useTareas());
    await waitFor(() => expect(result.current.cargado).toBe(true));

    act(() => {
      ultimoCanal().emitir(payloadInsert(tarea({ id: 3, order_index: 1 })));
    });

    expect(result.current.tareas.map((t) => t.id)).toEqual([1, 3, 2]);
  });

  it("UPDATE reemplaza la fila existente", async () => {
    vi.mocked(tareasService.obtenerTareasPersonales).mockResolvedValue([
      tarea({ id: 1, header: "Original" }),
    ]);
    const { result } = renderHook(() => useTareas());
    await waitFor(() => expect(result.current.cargado).toBe(true));

    act(() => {
      ultimoCanal().emitir(payloadUpdate(tarea({ id: 1, header: "Editada" })));
    });

    expect(result.current.tareas).toHaveLength(1);
    expect(result.current.tareas[0].header).toBe("Editada");
  });

  it("DELETE quita la fila", async () => {
    vi.mocked(tareasService.obtenerTareasPersonales).mockResolvedValue([
      tarea({ id: 1 }),
      tarea({ id: 2 }),
    ]);
    const { result } = renderHook(() => useTareas());
    await waitFor(() => expect(result.current.cargado).toBe(true));

    act(() => {
      ultimoCanal().emitir(payloadDelete(1));
    });

    expect(result.current.tareas.map((t) => t.id)).toEqual([2]);
  });

  it("perteneceAVista: un UPDATE que cambia room_id a otra sala la saca de la vista", async () => {
    const ajena = tarea({ id: 5, room_id: SALA, user_id: "otro" });
    vi.mocked(tareasService.obtenerTareasDeSala).mockResolvedValue([ajena]);
    const { result } = renderHook(() => useTareas(SALA));
    await waitFor(() => expect(result.current.cargado).toBe(true));

    act(() => {
      ultimoCanal().emitir(
        payloadUpdate({ ...ajena, room_id: "99999999-8888-7777-6666-555555555555" })
      );
    });

    expect(result.current.tareas).toEqual([]);
  });
});

describe("useTareas · supresión de ecos propios", () => {
  it("ignora el eco realtime dentro del margen de 500 ms y vuelve a aplicar después", async () => {
    vi.mocked(tareasService.obtenerTareasPersonales).mockResolvedValue([
      tarea({ id: 1, header: "Original" }),
    ]);
    vi.mocked(tareasService.actualizarTarea).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTareas());
    await waitFor(() => expect(result.current.cargado).toBe(true));

    // Fake timers recién acá: la carga inicial ya resolvió con timers reales
    vi.useFakeTimers();
    try {
      await act(async () => {
        await result.current.actualizarTareaCampos(1, { header: "Optimista" });
      });

      // Eco viejo dentro del margen: el optimismo es la verdad, se ignora
      act(() => {
        ultimoCanal().emitir(payloadUpdate(tarea({ id: 1, header: "Original" })));
      });
      expect(result.current.tareas[0].header).toBe("Optimista");

      // Pasado el margen (500 ms = MARGEN_ECO_MS), los eventos del id vuelven a aplicarse
      act(() => {
        vi.advanceTimersByTime(500);
      });
      act(() => {
        ultimoCanal().emitir(payloadUpdate(tarea({ id: 1, header: "Desde otro cliente" })));
      });
      expect(result.current.tareas[0].header).toBe("Desde otro cliente");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("useTareas · optimismo y rollback", () => {
  it("crearTarea: si el insert falla, la temporal desaparece y el error se propaga", async () => {
    const { result } = renderHook(() => useTareas());
    await waitFor(() => expect(result.current.cargado).toBe(true));

    vi.mocked(tareasService.crearTarea).mockRejectedValue(new Error("insert falló"));

    await expect(
      act(async () => {
        await result.current.crearTarea({ header: "Nueva" }, "personal");
      })
    ).rejects.toThrow("insert falló");

    expect(result.current.tareas).toEqual([]);
  });

  it("crearTarea: reemplaza la temporal por la fila real sin duplicar si el eco llegó antes", async () => {
    const { result } = renderHook(() => useTareas());
    await waitFor(() => expect(result.current.cargado).toBe(true));

    const filaReal = tarea({ id: 42, header: "Nueva" });
    const insert = diferido<Tarea>();
    vi.mocked(tareasService.crearTarea).mockReturnValue(insert.promesa);

    let promesaCrear!: Promise<void>;
    act(() => {
      promesaCrear = result.current.crearTarea({ header: "Nueva" }, "personal") as Promise<void>;
    });

    // Prepend optimista con id temporal (>= 1.000.000)
    expect(result.current.tareas).toHaveLength(1);
    expect(result.current.tareas[0].id).toBeGreaterThanOrEqual(1000000);

    // El eco del realtime llega ANTES que la respuesta HTTP del insert
    act(() => {
      ultimoCanal().emitir(payloadInsert(filaReal));
    });

    await act(async () => {
      insert.resolver(filaReal);
      await promesaCrear;
    });

    // Una sola fila: la real, sin la temporal ni duplicados
    expect(result.current.tareas.map((t) => t.id)).toEqual([42]);
  });

  it("actualizarTareaCampos: ante rechazo del service, el array vuelve al estado previo", async () => {
    vi.mocked(tareasService.obtenerTareasPersonales).mockResolvedValue([
      tarea({ id: 1, header: "Original" }),
    ]);
    const { result } = renderHook(() => useTareas());
    await waitFor(() => expect(result.current.cargado).toBe(true));

    vi.mocked(tareasService.actualizarTarea).mockRejectedValue(new Error("update falló"));

    await expect(
      act(async () => {
        await result.current.actualizarTareaCampos(1, { header: "Editada" });
      })
    ).rejects.toThrow("update falló");

    expect(result.current.tareas[0].header).toBe("Original");
  });
});
