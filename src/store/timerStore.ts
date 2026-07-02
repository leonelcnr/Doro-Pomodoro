import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Modo, TimerSettings } from '@/types/timer';
import type { EstadoReloj } from '@/types/dominio';

// Tope de cordura para el tiempo del reloj (24 h en segundos). Por encima asumimos
// un estado corrupto persistido y lo saneamos al rehidratar.
const MAX_SEGUNDOS_VALIDOS = 24 * 60 * 60;

/**
 * Store global del temporizador (Zustand) con persistencia en localStorage.
 *
 * Centraliza el estado del reloj Pomodoro/cronómetro para que cualquier
 * componente (visualizador, ventana flotante, sala compartida) lea y modifique
 * la misma fuente de verdad. Gracias al middleware `persist`, el estado
 * sobrevive a recargas de página.
 *
 * NOTA sobre contratos: los VALORES del campo `modo`
 * ('pomodoro' | 'shortBreak' | 'longBreak' | 'stopwatch') y las CLAVES de
 * `configuracion` se mantienen en inglés a propósito, porque se usan como
 * índices entre sí (`configuracion[modo]`) y se sincronizan tal cual con la
 * columna `timer_state` de Supabase compartida entre clientes.
 */
interface EstadoTemporizador {
  tiempoRestante: number;      // Tiempo restante en segundos
  tiempoInicial: number;       // Valor para poder resetear (ej: 25 * 60)
  estaActivo: boolean;         // ¿Está corriendo el reloj?
  modo: Modo;                  // Fase/modo actual
  configuracion: TimerSettings;

  // --- Acciones (funciones que modifican el estado) ---
  establecerTiempoRestante: (tiempo: number) => void;
  establecerEstaActivo: (activo: boolean) => void;
  establecerModo: (modo: Modo) => void;
  establecerConfiguracion: (configuracion: TimerSettings) => void;
  reiniciarTemporizador: () => void;

  // Campos para recuperar el conteo exacto al recargar la página:
  // guardan el instante objetivo de fin (temporizador) o de inicio (cronómetro).
  tiempoFinObjetivo: number | null;
  tiempoInicioCronometro: number | null;
  establecerTiempoFinObjetivo: (tiempo: number | null) => void;
  establecerTiempoInicioCronometro: (tiempo: number | null) => void;

  // Sincronización con la sala compartida (Supabase)
  establecerEstadoTemporizador: (estado: EstadoReloj) => void;
  // Marca temporal del último cambio originado en este cliente (para disparar la sincronización)
  ultimaActualizacionLocal: number;
}

export const useTimerStore = create<EstadoTemporizador>()(
  persist(
    (set, get) => ({
  tiempoRestante: 25 * 60, // 25 minutos por defecto
  tiempoInicial: 25 * 60,
  estaActivo: false,
  modo: 'pomodoro',
  configuracion: {
    pomodoro: 25,
    shortBreak: 5,
    longBreak: 15,
    autoBreak: false,
  },
  tiempoFinObjetivo: null,
  tiempoInicioCronometro: null,
  ultimaActualizacionLocal: Date.now(),

  establecerTiempoRestante: (tiempo) => set({ tiempoRestante: tiempo }),
  // Al activar/pausar registramos la marca de tiempo local para que se sincronice
  establecerEstaActivo: (activo) => set({ estaActivo: activo, ultimaActualizacionLocal: Date.now() }),
  establecerTiempoFinObjetivo: (tiempo) => set({ tiempoFinObjetivo: tiempo }),
  establecerTiempoInicioCronometro: (tiempo) => set({ tiempoInicioCronometro: tiempo }),
  establecerConfiguracion: (configuracion) => set((estado) => {
    const cambios: Partial<EstadoTemporizador> = { configuracion };

    // Si el reloj está pausado y no es cronómetro, aplicamos la nueva duración
    // del modo actual de inmediato (para reflejar el cambio en pantalla).
    if (!estado.estaActivo && estado.modo !== 'stopwatch') {
      const tiempos = {
        pomodoro: configuracion.pomodoro * 60,
        shortBreak: configuracion.shortBreak * 60,
        longBreak: configuracion.longBreak * 60,
      };
      cambios.tiempoRestante = tiempos[estado.modo];
      cambios.tiempoInicial = tiempos[estado.modo];
    }

    cambios.ultimaActualizacionLocal = Date.now();
    return cambios;
  }),
  establecerModo: (modo) => {
    const { configuracion } = get();
    // Al pasar a cronómetro arrancamos en 0; en los demás modos reseteamos el
    // tiempo según la duración configurada de ese modo.
    if (modo === 'stopwatch') {
      set({ modo, tiempoRestante: 0, tiempoInicial: 0, estaActivo: false, ultimaActualizacionLocal: Date.now() });
      return;
    }
    const tiempos = {
      pomodoro: configuracion.pomodoro * 60,
      shortBreak: configuracion.shortBreak * 60,
      longBreak: configuracion.longBreak * 60,
    };
    set({ modo, tiempoRestante: tiempos[modo], tiempoInicial: tiempos[modo], estaActivo: false, ultimaActualizacionLocal: Date.now() });
  },
  reiniciarTemporizador: () => set({ tiempoRestante: get().tiempoInicial, estaActivo: false, tiempoFinObjetivo: null, tiempoInicioCronometro: null, ultimaActualizacionLocal: Date.now() }),
  establecerEstadoTemporizador: (datos) => set((estado) => {
    // Instante en que el emisor guardó este estado. Lo usamos como ancla ABSOLUTA
    // del reloj: todos los clientes calculan el mismo objetivo de fin/inicio a
    // partir de él, en vez de "ahora + tiempoRestante" (que difiere según la
    // latencia de cada quien y hace divergir los relojes).
    const referencia = datos.actualizadoEn ? new Date(datos.actualizadoEn).getTime() : Date.now();

    // Config compartida por la sala. Fallback a la local si la fila es vieja y no
    // trae `configuracion` (retrocompatibilidad). Es la fuente para el tiempoInicial.
    const configuracion = datos.configuracion ?? estado.configuracion;

    // Si el modo cambió por red, recalculamos también el tiempo inicial
    let tiempoInicial = estado.tiempoInicial;
    if (estado.modo !== datos.modo) {
       tiempoInicial = datos.modo === 'stopwatch' ? 0 : configuracion[datos.modo] * 60;
    }

    // IMPORTANTE: además de `tiempoRestante` hay que fijar las ANCLAS del intervalo
    // (`tiempoFinObjetivo` / `tiempoInicioCronometro`). `useTimer` recalcula el
    // tiempo restante desde esas anclas cada 200ms; si no las actualizamos, el
    // intervalo local pisa el valor sincronizado con su objetivo viejo y el reloj
    // nunca converge (ni siquiera al pausar/reanudar, porque el ancla sobrevive).

    // --- Cronómetro (cuenta progresiva) ---
    if (datos.modo === 'stopwatch') {
      if (datos.estaActivo) {
        const tiempoInicioCronometro = referencia - datos.tiempoRestante * 1000;
        const tiempoRestante = Math.max(0, Math.floor((Date.now() - tiempoInicioCronometro) / 1000));
        return { tiempoRestante, estaActivo: true, modo: datos.modo, tiempoInicial, configuracion, tiempoInicioCronometro, tiempoFinObjetivo: null };
      }
      return { tiempoRestante: Math.max(0, datos.tiempoRestante), estaActivo: false, modo: datos.modo, tiempoInicial, configuracion, tiempoInicioCronometro: null, tiempoFinObjetivo: null };
    }

    // --- Temporizador (cuenta regresiva) ---
    if (datos.estaActivo) {
      // Objetivo de fin absoluto, idéntico en todos los clientes (salvo desfase de
      // reloj de sistema). `useTimer` seguirá contando desde acá, no desde un ancla vieja.
      const tiempoFinObjetivo = referencia + datos.tiempoRestante * 1000;
      const tiempoRestante = Math.max(0, Math.ceil((tiempoFinObjetivo - Date.now()) / 1000));
      return { tiempoRestante, estaActivo: true, modo: datos.modo, tiempoInicial, configuracion, tiempoFinObjetivo, tiempoInicioCronometro: null };
    }
    // Pausado: aplicamos el tiempo tal cual y limpiamos las anclas para que, al
    // reanudar, `useTimer` recree el objetivo desde ESTE tiempo (y no uno viejo).
    return { tiempoRestante: Math.max(0, datos.tiempoRestante), estaActivo: false, modo: datos.modo, tiempoInicial, configuracion, tiempoFinObjetivo: null, tiempoInicioCronometro: null };
  }),
}),
{
  name: 'pomodoro-timer-storage', // nombre de la clave en localStorage
  // Al rehidratar desde localStorage NO reanudamos un reloj que había quedado
  // "corriendo" en una sesión anterior: arrancamos en pausa y descartamos los
  // instantes objetivo. Si no, un cronómetro dejado activo recalcula al reabrir
  // `(ahora - inicio)` de días → un `tiempoRestante` gigante que rompe el reloj.
  onRehydrateStorage: () => (estado) => {
    if (!estado) return;

    estado.estaActivo = false;
    estado.tiempoFinObjetivo = null;
    estado.tiempoInicioCronometro = null;

    // Saneamos un `tiempoRestante` corrupto (valores gigantes ya persistidos por el
    // bug, NaN o negativos), volviendo a un valor coherente con el modo actual.
    const esValido = Number.isFinite(estado.tiempoRestante)
      && estado.tiempoRestante >= 0
      && estado.tiempoRestante <= MAX_SEGUNDOS_VALIDOS;

    if (!esValido) {
      if (estado.modo === 'stopwatch') {
        estado.tiempoRestante = 0;
        estado.tiempoInicial = 0;
      } else {
        const segundos = (estado.configuracion?.[estado.modo] ?? 25) * 60;
        estado.tiempoRestante = segundos;
        estado.tiempoInicial = segundos;
      }
    }
  },
}
));
