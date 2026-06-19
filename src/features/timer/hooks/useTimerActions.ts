import { useEffect } from 'react';
import { useTimerStore } from '@/store/timerStore';
import supabase from '@/lib/supabase';
import { useAuth } from '@/features/auth/context/useAuth';

// Importamos los audios para que Vite los procese y entregue la URL final
import rutaSonidoTick from '@/assets/sounds/tick.mp3';
import rutaSonidoAlarma from '@/assets/sounds/alarm.mp3';

// Instancias globales de Audio: se crean una sola vez y quedan "desbloqueadas"
// tras la primera interacción del usuario, evitando recrearlas en cada render.
const audioAlarma = new Audio(rutaSonidoAlarma);
audioAlarma.volume = 0.5;

const audioTick = new Audio(rutaSonidoTick);
audioTick.volume = 0.4;

/**
 * Hook con la lógica del reloj: corre el intervalo de cuenta regresiva
 * (temporizador) o progresiva (cronómetro), reproduce sonidos, persiste las
 * sesiones de estudio en Supabase y expone las acciones para los botones.
 */
export const useTimer = () => {
  const { user } = useAuth();
  // Traemos estado y acciones persistentes desde el store de Zustand
  const {
    tiempoRestante, estaActivo, modo, configuracion,
    tiempoFinObjetivo, tiempoInicioCronometro,
    establecerTiempoRestante, establecerEstaActivo, establecerModo,
    establecerTiempoFinObjetivo, establecerTiempoInicioCronometro
  } = useTimerStore();

  useEffect(() => {
    let intervalo: ReturnType<typeof setInterval> | undefined;

    if (estaActivo) {
      if (modo === 'stopwatch') {
        // --- Lógica del Cronómetro (cuenta progresiva) ---
        if (!tiempoInicioCronometro) {
          // Sin instante de inicio guardado: lo fijamos para poder recuperar la sesión
          establecerTiempoInicioCronometro(Date.now() - tiempoRestante * 1000);
          return; // Esperamos al siguiente render ya con el inicio establecido
        }

        intervalo = setInterval(() => {
          const ahora = Date.now();
          const diferencia = ahora - tiempoInicioCronometro;
          const segundosTranscurridos = Math.floor(diferencia / 1000);

          if (segundosTranscurridos !== tiempoRestante) {
            establecerTiempoRestante(segundosTranscurridos);
          }
        }, 200);

      } else if (tiempoRestante > 0) {
        // --- Lógica del Temporizador (cuenta regresiva) ---
        // 1. Si recién arrancamos (o reanudamos), usamos el instante objetivo
        //    guardado o lo creamos a partir del tiempo restante.
      if (!tiempoFinObjetivo) {
        establecerTiempoFinObjetivo(Date.now() + tiempoRestante * 1000);
        return; // Esperamos al siguiente render con el objetivo establecido
      }

      // 2. Arrancamos el intervalo
      intervalo = setInterval(() => {
        const ahora = Date.now();
        // Cuánto falta = instante objetivo de fin menos el ahora
        const diferencia = tiempoFinObjetivo - ahora;

        // Convertimos milisegundos a segundos
        const segundosRestantes = Math.ceil(diferencia / 1000);

        if (segundosRestantes <= 0) {
          // EL TEMPORIZADOR TERMINÓ
          establecerTiempoRestante(0);
          establecerEstaActivo(false);
          establecerTiempoFinObjetivo(null); // Limpiamos la referencia guardada

          // Disparamos el sonido de alarma
          audioAlarma.currentTime = 0;
          audioAlarma.play().catch(e => console.error("Falló la reproducción de audio:", e));

          clearInterval(intervalo);

          // Guardamos la sesión de estudio si veníamos de un pomodoro
          if (modo === 'pomodoro' && user) {
            const minutosAGuardar = configuracion.pomodoro;

            // RPC que acumula los minutos totales del usuario (nombre y parámetro fijados por Supabase)
            supabase.rpc('update_user_stats', { extra_minutes: minutosAGuardar })
              .then(({ error: errorEstadisticas }) => {
                if (errorEstadisticas) console.error("Error update_user_stats:", errorEstadisticas);
              });

            // Registramos la sesión individual de estudio
            supabase.from('study_sessions').insert([
              { user_id: user.id, duration_minutes: minutosAGuardar }
            ]).then(({ error: errorSesion }) => {
              if (errorSesion) console.error("Error al insertar study_session:", errorSesion);
            });
          }

          // Transición automática al terminar la fase actual
          if (modo === 'pomodoro') {
            establecerModo('shortBreak');
            if (configuracion.autoBreak) {
              setTimeout(() => establecerEstaActivo(true), 0);
            }
          } else {
            // Si veníamos de un descanso, volvemos a pomodoro
            establecerModo('pomodoro');
            if (configuracion.autoBreak) {
              setTimeout(() => establecerEstaActivo(true), 0);
            }
          }
        } else {
          // Reproducimos los "ticks" detectando saltos (el intervalo se ralentiza
          // en pestañas en segundo plano), comprobando si cruzamos cada umbral.
          const cruzo10 = tiempoRestante > 10 && segundosRestantes <= 10;
          const cruzo5 = tiempoRestante > 5 && segundosRestantes <= 5;
          const cruzo3 = tiempoRestante > 3 && segundosRestantes <= 3;
          const cruzo2 = tiempoRestante > 2 && segundosRestantes <= 2;
          const cruzo1 = tiempoRestante > 1 && segundosRestantes <= 1;

          // Verificamos si justo tocamos o saltamos los 10 o 5 segundos
          if (cruzo10 || cruzo5 || cruzo3 || cruzo2 || cruzo1) {
             // Solo sonamos el tick en los 10 y 5 segundos
             if ((cruzo10 && segundosRestantes > 5) || cruzo5) {
                audioTick.currentTime = 0;
                audioTick.play().catch(e => console.error("Falló el tick de audio:", e));
             }
          }

          // Actualizamos el estado solo si cambió el segundo
          if (segundosRestantes !== tiempoRestante) {
             establecerTiempoRestante(segundosRestantes);
          }
        }
      }, 200); // Chequeamos cada 200ms para fluidez visual, aunque el cálculo es exacto
      }
    } else {
      // Si pausamos (o no se cumple la condición de tiempo), limpiamos el intervalo
      if (intervalo) clearInterval(intervalo);
      // No reseteamos a null acá para no provocar un render extra; se maneja en los botones
    }

    // Limpieza: al desmontar el componente, cancelamos el intervalo
    return () => clearInterval(intervalo);
  }, [estaActivo, establecerTiempoRestante, establecerEstaActivo, tiempoRestante, modo, configuracion.pomodoro, user, establecerModo, configuracion.autoBreak, tiempoFinObjetivo, tiempoInicioCronometro, establecerTiempoFinObjetivo, establecerTiempoInicioCronometro]); // Dependencias

  // --- Funciones que disparan los botones de la interfaz ---
  const alternarTemporizador = () => {
    if (estaActivo) {
      // Si estamos pausando, descartamos los instantes objetivo guardados
      establecerTiempoFinObjetivo(null);
      establecerTiempoInicioCronometro(null);
    }
    establecerEstaActivo(!estaActivo);
  };

  const manejarReinicio = () => {
    if (modo === 'stopwatch') {
      establecerTiempoRestante(0);
      establecerEstaActivo(false);
      establecerTiempoInicioCronometro(null);
    } else {
      establecerModo('pomodoro');
      establecerTiempoFinObjetivo(null);
    }
  };

  const ponerPomodoro = () => establecerModo('pomodoro');
  const ponerDescansoLargo = () => establecerModo('longBreak');
  const ponerDescansoCorto = () => establecerModo('shortBreak');
  const ponerCronometro = () => establecerModo('stopwatch');

  return { tiempoRestante, estaActivo, modo, alternarTemporizador, manejarReinicio, ponerPomodoro, ponerDescansoLargo, ponerDescansoCorto, ponerCronometro };
};
