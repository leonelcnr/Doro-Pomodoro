import type { Modo } from '@/types/timer';

/**
 * Identidad visual de cada fase del reloj, compartida entre el indicador de la
 * UI principal (`IndicadorModo`) y la ventana flotante (`FloatingTimer`) para no
 * duplicar el mapeo de etiquetas y colores.
 */

/** Etiqueta legible (en español) de cada fase. */
export const ETIQUETA_MODO: Record<Modo, string> = {
    pomodoro: 'Pomodoro',
    shortBreak: 'Descanso Corto',
    longBreak: 'Descanso Largo',
    stopwatch: 'Cronómetro',
};

/** Clases del punto luminoso que identifica cada fase por color. */
export const PUNTO_MODO: Record<Modo, string> = {
    pomodoro: 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]',
    shortBreak: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]',
    longBreak: 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]',
    stopwatch: 'bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.5)]',
};
