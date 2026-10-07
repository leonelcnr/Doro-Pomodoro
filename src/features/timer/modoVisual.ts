import type { Modo } from '@/types/timer';

/**
 * El nombre de cada fase del reloj, compartido entre el indicador de la sala
 * (`IndicadorModo`) y la ventana flotante (`FloatingTimer`). El color ya no
 * depende de la fase: todo usa el acento.
 */

/** Etiqueta legible (en español) de cada fase. */
export const ETIQUETA_MODO: Record<Modo, string> = {
    pomodoro: 'Pomodoro',
    shortBreak: 'Descanso corto',
    longBreak: 'Descanso largo',
    stopwatch: 'Cronómetro',
};
