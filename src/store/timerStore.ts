import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Modo, TimerSettings } from '@/types/timer';
import type { EstadoReloj } from '@/types/dominio';

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
    // Si llega la fecha de actualización y el reloj está activo, compensamos la
    // latencia de red restando los segundos transcurridos desde ese instante.
    let nuevoTiempoRestante = datos.tiempoRestante;
    if (datos.estaActivo && datos.actualizadoEn) {
      const milisegundosTranscurridos = Date.now() - new Date(datos.actualizadoEn).getTime();
      const segundosTranscurridos = Math.floor(milisegundosTranscurridos / 1000);
      nuevoTiempoRestante = Math.max(0, datos.tiempoRestante - segundosTranscurridos);
    }

    // Si el modo cambió por red, recalculamos también el tiempo inicial
    let tiempoInicial = estado.tiempoInicial;
    if (estado.modo !== datos.modo) {
       if (datos.modo === 'stopwatch') {
           tiempoInicial = 0;
       } else {
           tiempoInicial = estado.configuracion[datos.modo] * 60;
       }
    }

    return {
      tiempoRestante: nuevoTiempoRestante,
      estaActivo: datos.estaActivo,
      modo: datos.modo,
      tiempoInicial
    };
  }),
}),
{
  name: 'pomodoro-timer-storage', // nombre de la clave en localStorage
}
));
