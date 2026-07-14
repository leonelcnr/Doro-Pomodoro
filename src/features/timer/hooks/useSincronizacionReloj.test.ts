import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useSincronizacionReloj } from "./useSincronizacionReloj";
import { useTimerStore } from "@/store/timerStore";
import * as salasService from "@/features/room/services/salasService";
import { diferido } from "@/test/diferido";
import type { EstadoReloj } from "@/types/dominio";
import type { FilaSala } from "@/features/room/services/salasService";

vi.mock("@/features/room/services/salasService", () => ({
  obtenerEstadoReloj: vi.fn(),
  suscribirCambiosSala: vi.fn(),
  guardarEstadoReloj: vi.fn(),
}));

const SALA = "11111111-2222-3333-4444-555555555555";

// Estado remoto de ejemplo, pausado (así el store lo aplica tal cual, sin
// recalcular contra Date.now())
const estadoRemoto: EstadoReloj = {
  tiempoRestante: 300,
  estaActivo: false,
  modo: "shortBreak",
  actualizadoEn: "2026-07-14T12:00:00.000Z",
  configuracion: { pomodoro: 30, shortBreak: 5, longBreak: 15, autoBreak: true },
};

// Foto del estado inicial del store (incluye las acciones) para resetearlo entero
const estadoInicialStore = useTimerStore.getState();

describe("useSincronizacionReloj", () => {
  let desuscribir: Mock<() => void>;
  let callbackRealtime: ((fila: FilaSala) => void) | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    useTimerStore.setState(estadoInicialStore, true);

    desuscribir = vi.fn();
    callbackRealtime = undefined;
    vi.mocked(salasService.obtenerEstadoReloj).mockResolvedValue(null);
    vi.mocked(salasService.guardarEstadoReloj).mockResolvedValue(undefined);
    vi.mocked(salasService.suscribirCambiosSala).mockImplementation((_salaId, cb) => {
      callbackRealtime = cb;
      return desuscribir;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("bajada inicial: al montar carga el estado guardado y lo aplica al store", async () => {
    vi.mocked(salasService.obtenerEstadoReloj).mockResolvedValue(estadoRemoto);

    renderHook(() => useSincronizacionReloj(SALA));

    expect(salasService.obtenerEstadoReloj).toHaveBeenCalledWith(SALA);
    await waitFor(() => {
      expect(useTimerStore.getState().modo).toBe("shortBreak");
    });
    expect(useTimerStore.getState().tiempoRestante).toBe(300);
    expect(useTimerStore.getState().configuracion.pomodoro).toBe(30);
  });

  it("realtime: un cambio remoto de timer_state actualiza el store", async () => {
    renderHook(() => useSincronizacionReloj(SALA));
    await waitFor(() => expect(callbackRealtime).toBeDefined());

    act(() => {
      callbackRealtime!({ timer_state: estadoRemoto });
    });

    expect(useTimerStore.getState().modo).toBe("shortBreak");
    expect(useTimerStore.getState().tiempoRestante).toBe(300);
    // Aplicar un estado remoto NO debe re-subirlo (evita el bucle de eco)
    expect(salasService.guardarEstadoReloj).not.toHaveBeenCalled();
  });

  it("guard de montaje: la primera corrida NO sube el reloj local persistido", async () => {
    renderHook(() => useSincronizacionReloj(SALA));

    // Dejamos pasar la carga inicial y cualquier microtarea pendiente
    await act(async () => {});

    expect(salasService.guardarEstadoReloj).not.toHaveBeenCalled();
  });

  it("subida genuina: un cambio local posterior al montaje persiste el estado con la forma esperada", async () => {
    renderHook(() => useSincronizacionReloj(SALA));
    await act(async () => {});

    act(() => {
      useTimerStore.getState().establecerEstaActivo(true);
    });

    await waitFor(() => {
      expect(salasService.guardarEstadoReloj).toHaveBeenCalledTimes(1);
    });
    expect(salasService.guardarEstadoReloj).toHaveBeenCalledWith(
      SALA,
      expect.objectContaining({
        tiempoRestante: expect.any(Number),
        estaActivo: true,
        modo: "pomodoro",
        configuracion: expect.objectContaining({ pomodoro: expect.any(Number) }),
        actualizadoEn: expect.any(String),
      })
    );
  });

  it("cleanup: al desmontar se desuscribe y una respuesta tardía no aplica estado", async () => {
    const carga = diferido<EstadoReloj | null>();
    vi.mocked(salasService.obtenerEstadoReloj).mockReturnValue(carga.promesa);

    const { unmount } = renderHook(() => useSincronizacionReloj(SALA));
    unmount();

    expect(desuscribir).toHaveBeenCalledTimes(1);

    // La carga inicial responde DESPUÉS del desmontaje: el flag `activo` debe ignorarla
    await act(async () => {
      carga.resolver(estadoRemoto);
    });

    expect(useTimerStore.getState().modo).toBe("pomodoro"); // sigue el default
    expect(useTimerStore.getState().tiempoRestante).toBe(25 * 60);
  });

  it("error: si obtenerEstadoReloj rechaza, no explota y el store queda intacto", async () => {
    const errorConsola = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(salasService.obtenerEstadoReloj).mockRejectedValue(new Error("falló la red"));

    renderHook(() => useSincronizacionReloj(SALA));
    await act(async () => {});

    expect(useTimerStore.getState().modo).toBe("pomodoro");
    expect(useTimerStore.getState().tiempoRestante).toBe(25 * 60);
    expect(errorConsola).toHaveBeenCalled();
  });

  it("sin salaId: no toca el service", async () => {
    renderHook(() => useSincronizacionReloj(undefined));
    await act(async () => {});

    expect(salasService.obtenerEstadoReloj).not.toHaveBeenCalled();
    expect(salasService.suscribirCambiosSala).not.toHaveBeenCalled();
  });
});
