// Tipos compartidos del temporizador (Pomodoro / cronómetro).
// Centralizados aquí para evitar duplicarlos entre el store y los componentes
// (antes TimerSettings estaba definido por separado en TimerDisplay y DialogSettings).

/**
 * Modo / fase actual del reloj. Los valores se usan como índices de la
 * configuración (`configuracion[modo]`) y se sincronizan tal cual con la
 * columna `timer_state` de Supabase, por eso se mantienen en inglés.
 */
export type Modo = 'pomodoro' | 'shortBreak' | 'longBreak' | 'stopwatch';

/**
 * Configuración de duraciones (en minutos) de cada fase + auto-descanso.
 * Las claves coinciden con los valores de `Modo` para poder indexarse entre sí.
 */
export interface TimerSettings {
  pomodoro: number;
  shortBreak: number;
  longBreak: number;
  autoBreak: boolean;
}
