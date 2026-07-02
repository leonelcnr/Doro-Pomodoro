import { useEffect, useRef } from "react";
import { useTimerStore } from "@/store/timerStore";
import * as salasService from "@/features/room/services/salasService";

/**
 * Unifica la sincronización del reloj compartido de una sala con Supabase.
 *
 * Antes esta lógica estaba partida en dos componentes que no se conocían bien
 * (problema 2.4 del plan):
 *  - la SUBIDA del estado local vivía en `TimerDisplay`,
 *  - la BAJADA (carga inicial + realtime) vivía en `RoomPage`.
 *
 * Al juntarlas acá, `TimerDisplay` deja de saber de Supabase y `RoomPage` deja
 * de manejar el canal del reloj a mano. Se debe invocar UNA sola vez por sala
 * (hoy, desde `RoomPage`).
 */
export function useSincronizacionReloj(salaId?: string) {
  const establecerEstadoTemporizador = useTimerStore((estado) => estado.establecerEstadoTemporizador);
  const ultimaActualizacionLocal = useTimerStore((estado) => estado.ultimaActualizacionLocal);

  // Evita que la PRIMERA corrida del efecto de subida (con el `ultimaActualizacionLocal`
  // que viene persistido de localStorage) pise el estado real de la sala con el reloj
  // local viejo. Solo subimos ante cambios locales genuinos posteriores al montaje.
  const montajeInicial = useRef(true);

  // BAJADA: carga inicial del estado guardado + suscripción en tiempo real a los
  // cambios de `timer_state` de la sala.
  useEffect(() => {
    if (!salaId) return;

    let activo = true;
    // Al (re)entrar a una sala, la próxima corrida de la subida es "inicial": no debe
    // pisar el estado compartido con el reloj local hasta que la bajada lo cargue.
    montajeInicial.current = true;

    salasService.obtenerEstadoReloj(salaId)
      .then((estadoReloj) => {
        if (activo && estadoReloj) establecerEstadoTemporizador(estadoReloj);
      })
      .catch((error) => {
        console.error("Error al cargar el estado del reloj:", error);
      });

    const desuscribir = salasService.suscribirCambiosSala(salaId, (fila) => {
      if (fila.timer_state) establecerEstadoTemporizador(fila.timer_state);
    });

    return () => {
      activo = false;
      desuscribir();
    };
  }, [salaId, establecerEstadoTemporizador]);

  // SUBIDA: ante cada cambio originado en este cliente, persiste el estado actual
  // del reloj en la columna `timer_state` para compartirlo con el resto de la sala.
  useEffect(() => {
    if (!salaId || !ultimaActualizacionLocal) return;

    // Saltear la primera corrida tras montar/cambiar de sala: ese valor viene de
    // localStorage, no de un cambio local recién hecho por el usuario en esta sala.
    if (montajeInicial.current) {
      montajeInicial.current = false;
      return;
    }

    const estado = useTimerStore.getState();
    // Objeto que se guarda en `timer_state` y se comparte entre clientes
    const nuevoEstado = {
      tiempoRestante: estado.tiempoRestante,
      estaActivo: estado.estaActivo,
      modo: estado.modo,
      configuracion: estado.configuracion,
      actualizadoEn: new Date().toISOString(),
    };

    salasService.guardarEstadoReloj(salaId, nuevoEstado).catch((error) => {
      console.error("Error al actualizar el temporizador:", error);
    });
  }, [ultimaActualizacionLocal, salaId]);
}
