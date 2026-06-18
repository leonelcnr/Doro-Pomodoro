import { useCallback, useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import * as tareasService from "@/features/tasks/services/tareasService";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { Tarea, TareaPayload } from "@/types/dominio";

// Ámbito sobre el que opera un guardado de tareas: las personales (sin sala) o
// las de la sala activa. Determina el filtro de borrado y el `room_id` asignado.
export type AmbitoTarea = "personal" | "sala";

/**
 * Hook de dominio para las tareas. Encapsula la carga inicial, la suscripción
 * en tiempo real y los handlers de cambio/movimiento que antes estaban
 * duplicados (casi idénticos) entre `Home` y `RoomPage`.
 *
 * - Sin `salaId` (Home): trae y escucha solo las tareas personales del usuario.
 * - Con `salaId` (RoomPage): trae las de la sala + las personales, y escucha
 *   ambos conjuntos.
 *
 * El hook es agnóstico de la UI: no sabe de pestañas ni de "no vistas". Expone
 * el listado crudo y deja al llamador decidir qué muestra. Los handlers
 * re-lanzan los errores para que cada página elija cómo avisar al usuario.
 */
export function useTareas(salaId?: string) {
  const { user: usuario } = useAuth();
  const [tareas, establecerTareas] = useState<Tarea[]>([]);
  // Indica si terminó la primera carga (útil para lógica de UI que no debe
  // dispararse antes de tener datos, p. ej. el contador de tareas "no vistas").
  const [cargado, establecerCargado] = useState(false);

  // Recarga el listado según el ámbito (personal o de sala)
  const recargar = useCallback(async () => {
    if (!usuario) return;
    try {
      const data = salaId
        ? await tareasService.obtenerTareasDeSala(salaId, usuario.id)
        : await tareasService.obtenerTareasPersonales(usuario.id);
      establecerCargado(true);
      establecerTareas(data);
    } catch (error) {
      console.error("Error al cargar las tareas:", error);
    }
  }, [salaId, usuario]);

  // Carga inicial + suscripción en tiempo real a la tabla `tasks`
  useEffect(() => {
    if (!usuario) return;

    recargar();

    // Cuando hay sala escuchamos tanto las tareas de la sala como las personales;
    // sin sala, solo las personales. En ambos casos recargamos ante cualquier cambio.
    const canal = supabase.channel(salaId ? `realtime-tasks-${salaId}` : "realtime-home-tasks");

    if (salaId) {
      canal.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `room_id=eq.${salaId}` },
        () => { recargar(); }
      );
    }

    canal.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${usuario.id}` },
      () => { recargar(); }
    );

    canal.subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario, salaId, recargar]);

  // Persiste en Supabase los cambios hechos sobre la tabla de tareas
  // (alta, baja, edición, reordenamiento por drag & drop) dentro de un ámbito.
  const guardarCambios = useCallback(async (nuevoEstadoTareas: Tarea[], ambito: AmbitoTarea) => {
    const nuevosIds = new Set(nuevoEstadoTareas.map(t => t.id));

    // Solo borramos dentro del ámbito afectado (las tareas del otro ámbito no se tocan)
    const tareasAmbito = ambito === "personal"
      ? tareas.filter(t => t.room_id === null)
      : tareas.filter(t => t.room_id === salaId);

    const idsEliminados = tareasAmbito.filter(t => !nuevosIds.has(t.id)).map(t => t.id);

    const tareasExistentesActualizar: TareaPayload[] = [];
    const tareasNuevasInsertar: TareaPayload[] = [];

    nuevoEstadoTareas.forEach((t) => {
      // Las claves se mantienen en inglés porque son columnas de la tabla `tasks`
      const datosNuevaTarea = {
        user_id: usuario?.id,
        room_id: t.room_id ? t.room_id : (ambito === "sala" ? salaId : null),
        header: t.header,
        type: t.type,
        status: t.status,
        priority: t.priority,
        favorite: t.favorite,
        order_index: t.order_index,
      };

      // Los ids por debajo de 1.000.000 son reales (de la DB); el resto son
      // temporales generados en el cliente para tareas recién creadas.
      if (t.id && t.id < 1000000) {
        tareasExistentesActualizar.push({ id: t.id, ...datosNuevaTarea });
      } else {
        tareasNuevasInsertar.push(datosNuevaTarea);
      }
    });

    await tareasService.eliminarTareas(idsEliminados);
    await tareasService.upsertTareas(tareasExistentesActualizar);
    await tareasService.insertarTareas(tareasNuevasInsertar);
  }, [tareas, salaId, usuario?.id]);

  // Mueve una tarea entre el ámbito personal y el de la sala (alterna su room_id)
  const moverTarea = useCallback(async (tareaId: number) => {
    const tarea = tareas.find(t => t.id === tareaId);
    if (!tarea) return;

    const nuevaSalaId = tarea.room_id ? null : (salaId ?? null);
    await tareasService.moverTarea(tareaId, nuevaSalaId);
  }, [tareas, salaId]);

  return { tareas, cargado, recargar, guardarCambios, moverTarea };
}
