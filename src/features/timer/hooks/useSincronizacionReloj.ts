import { useEffect } from "react";
import supabase from "@/lib/supabase";
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

  // BAJADA: carga inicial del estado guardado + suscripción en tiempo real a los
  // cambios de `timer_state` de la sala.
  useEffect(() => {
    if (!salaId) return;

    let activo = true;

    salasService.obtenerEstadoReloj(salaId)
      .then((estadoReloj) => {
        if (activo && estadoReloj) establecerEstadoTemporizador(estadoReloj);
      })
      .catch((error) => {
        console.error("Error al cargar el estado del reloj:", error);
      });

    const canal = supabase
      .channel(`realtime-room-${salaId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${salaId}` },
        (payload) => {
          if (payload.new && payload.new.timer_state) {
            establecerEstadoTemporizador(payload.new.timer_state);
          }
        }
      )
      .subscribe();

    return () => {
      activo = false;
      supabase.removeChannel(canal);
    };
  }, [salaId, establecerEstadoTemporizador]);

  // SUBIDA: ante cada cambio originado en este cliente, persiste el estado actual
  // del reloj en la columna `timer_state` para compartirlo con el resto de la sala.
  useEffect(() => {
    if (!salaId || !ultimaActualizacionLocal) return;

    const estado = useTimerStore.getState();
    // Objeto que se guarda en `timer_state` y se comparte entre clientes
    const nuevoEstado = {
      tiempoRestante: estado.tiempoRestante,
      estaActivo: estado.estaActivo,
      modo: estado.modo,
      actualizadoEn: new Date().toISOString(),
    };

    salasService.guardarEstadoReloj(salaId, nuevoEstado).catch((error) => {
      console.error("Error al actualizar el temporizador:", error);
    });
  }, [ultimaActualizacionLocal, salaId]);
}
