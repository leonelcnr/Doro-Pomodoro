import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import supabase from "@/lib/supabase";
import * as tareasService from "@/features/tasks/services/tareasService";
import { useAuth } from "@/features/auth/context/useAuth";
import type { Tarea, TareaPayload } from "@/types/dominio";
import {
  CATEGORIA_POR_DEFECTO,
  ESTADO_POR_DEFECTO,
  PRIORIDAD_POR_DEFECTO,
} from "@/features/tasks/atributos";

// Ámbito sobre el que opera un guardado de tareas: las personales (sin sala) o
// las de la sala activa. Determina el filtro de borrado y el `room_id` asignado.
export type AmbitoTarea = "personal" | "sala";

// Margen tras confirmar una escritura propia durante el cual seguimos ignorando
// los ecos del realtime para esa tarea (cubre la latencia del broadcast).
const MARGEN_ECO_MS = 500;

/**
 * Ordena las tareas igual que la consulta del servidor: por `order_index`
 * ascendente (los `null` al final) y, a igualdad, por `created_at` descendente.
 * Se usa para reconciliar el array tras un merge incremental del realtime.
 */
function ordenarTareas(arr: Tarea[]): Tarea[] {
  return [...arr].sort((a, b) => {
    const oa = a.order_index;
    const ob = b.order_index;
    if (oa != null && ob != null) {
      if (oa !== ob) return oa - ob;
    } else if (oa != null) {
      return -1;
    } else if (ob != null) {
      return 1;
    }
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
}

/**
 * Hook de dominio para las tareas. Encapsula la carga inicial, la suscripción
 * en tiempo real y los handlers de cambio/movimiento que antes estaban
 * duplicados (casi idénticos) entre `Home` y `RoomPage`.
 *
 * - Sin `salaId` (Home): trae y escucha solo las tareas personales del usuario.
 * - Con `salaId` (RoomPage): trae las de la sala + las personales, y escucha
 *   ambos conjuntos.
 *
 * Rendimiento (evita el "revertir y saltar" al editar rápido): el realtime hace
 * un **merge incremental** por `payload` (no un `SELECT *` que pisa todo), y se
 * lleva un registro de **cambios propios en vuelo** (`pendientesRef`) para
 * ignorar los ecos viejos del realtime mientras nuestro optimismo es la verdad.
 */
export function useTareas(salaId?: string) {
  const { user: usuario } = useAuth();
  const [tareas, establecerTareas] = useState<Tarea[]>([]);
  const [cargado, establecerCargado] = useState(false);

  // Cache de cambios en vuelo: id → cantidad de escrituras propias pendientes.
  // Mientras un id tiene pendientes, ignoramos los ecos del realtime para él.
  const pendientesRef = useRef<Map<number, number>>(new Map());

  const marcarPendiente = useCallback((id: number) => {
    pendientesRef.current.set(id, (pendientesRef.current.get(id) ?? 0) + 1);
  }, []);

  // Libera una escritura pendiente tras un margen, para que el eco del realtime
  // (que llega después de la respuesta HTTP) no revierta el optimismo.
  const liberarPendiente = useCallback((id: number) => {
    setTimeout(() => {
      const n = (pendientesRef.current.get(id) ?? 0) - 1;
      if (n <= 0) pendientesRef.current.delete(id);
      else pendientesRef.current.set(id, n);
    }, MARGEN_ECO_MS);
  }, []);

  // ¿La fila corresponde a la vista actual? (personal: propia y sin sala;
  // sala: de la sala o personal del usuario). Permite que un UPDATE que cambia
  // `room_id` saque/agregue la fila correctamente en el merge.
  const perteneceAVista = useCallback(
    (fila: Tarea) => {
      if (!usuario) return false;
      if (salaId) {
        return fila.room_id === salaId || (fila.room_id == null && fila.user_id === usuario.id);
      }
      return fila.user_id === usuario.id && fila.room_id == null;
    },
    [salaId, usuario]
  );

  // Recarga completa (solo carga inicial y rollback ante error).
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

  // Aplica UN cambio del realtime sobre el array local (merge incremental).
  const aplicarCambioRealtime = useCallback(
    (payload: RealtimePostgresChangesPayload<Tarea>) => {
      if (!usuario) return;
      const nueva = payload.new as Tarea;
      const vieja = payload.old as Partial<Tarea>;
      const id = (payload.eventType === "DELETE" ? vieja.id : nueva.id) as number | undefined;
      if (id == null) return;

      // Eco de un cambio propio aún en vuelo: nuestro optimismo es autoritativo.
      if (pendientesRef.current.has(id)) return;

      establecerTareas((prev) => {
        if (payload.eventType === "DELETE") {
          return prev.filter((t) => t.id !== id);
        }
        // Si dejó de pertenecer a la vista (p. ej. cambió de ámbito), la quitamos.
        if (!perteneceAVista(nueva)) {
          return prev.filter((t) => t.id !== nueva.id);
        }
        const existe = prev.some((t) => t.id === nueva.id);
        const fusionado = existe
          ? prev.map((t) => (t.id === nueva.id ? nueva : t))
          : [nueva, ...prev];
        return ordenarTareas(fusionado);
      });
    },
    [usuario, perteneceAVista]
  );

  // Carga inicial + suscripción en tiempo real a la tabla `tasks`
  useEffect(() => {
    if (!usuario) return;

    recargar();

    const canal = supabase.channel(salaId ? `realtime-tasks-${salaId}` : "realtime-home-tasks");

    if (salaId) {
      canal.on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `room_id=eq.${salaId}` },
        aplicarCambioRealtime
      );
    }

    canal.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${usuario.id}` },
      aplicarCambioRealtime
    );

    canal.subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario, salaId, recargar, aplicarCambioRealtime]);

  // Persiste en Supabase los cambios hechos sobre la tabla de tareas
  // (alta, baja, edición, reordenamiento por drag & drop) dentro de un ámbito.
  const guardarCambios = useCallback(
    async (nuevoEstadoTareas: Tarea[], ambito: AmbitoTarea) => {
      const nuevosIds = new Set(nuevoEstadoTareas.map((t) => t.id));

      // Solo borramos dentro del ámbito afectado (las del otro ámbito no se tocan)
      const tareasAmbito = ambito === "personal"
        ? tareas.filter((t) => t.room_id === null)
        : tareas.filter((t) => t.room_id === salaId);

      const idsEliminados = tareasAmbito.filter((t) => !nuevosIds.has(t.id)).map((t) => t.id);

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
          description: t.description,
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

      // Marcamos como pendientes los ids reales afectados para que los ecos del
      // realtime (varios UPDATE de order_index, etc.) no reviertan el optimismo.
      const idsAfectados = [...idsEliminados, ...tareasExistentesActualizar.map((t) => t.id!)] as number[];
      idsAfectados.forEach(marcarPendiente);

      // Optimismo: reflejamos el nuevo estado del ámbito en `tareas` ya mismo,
      // conservando las del otro ámbito (así la tabla no se desincroniza ni
      // revierte ante un eco concurrente de otra tarea).
      establecerTareas((prev) => {
        const delOtroAmbito = ambito === "personal"
          ? prev.filter((t) => t.room_id != null)
          : prev.filter((t) => t.room_id !== salaId);
        return [...nuevoEstadoTareas, ...delOtroAmbito];
      });

      try {
        await tareasService.eliminarTareas(idsEliminados);
        await tareasService.upsertTareas(tareasExistentesActualizar);
        await tareasService.insertarTareas(tareasNuevasInsertar);
      } finally {
        idsAfectados.forEach(liberarPendiente);
      }
    },
    [tareas, salaId, usuario?.id, marcarPendiente, liberarPendiente]
  );

  // Ruta rápida de alta: crea UNA tarea con un solo insert (sin reconstruir el
  // array). Hace prepend optimista con un id temporal y reconcilia con la fila
  // real que devuelve la DB (deduplicando si el eco del realtime llegó antes).
  const crearTarea = useCallback(async (parcial: TareaPayload, ambito: AmbitoTarea) => {
    if (!usuario) return;

    const idTemporal = Date.now() + Math.floor(Math.random() * 1000);
    const roomId = ambito === "sala" ? (salaId ?? null) : null;

    const payload: TareaPayload = {
      user_id: usuario.id,
      room_id: roomId,
      header: parcial.header?.trim() || "Nueva Tarea",
      type: parcial.type?.trim() || CATEGORIA_POR_DEFECTO,
      status: parcial.status || ESTADO_POR_DEFECTO,
      priority: parcial.priority || PRIORIDAD_POR_DEFECTO,
      favorite: parcial.favorite ?? false,
      description: parcial.description,
    };

    const tareaOptimista = { id: idTemporal, ...payload } as Tarea;
    establecerTareas((prev) => [tareaOptimista, ...prev]);

    try {
      const real = await tareasService.crearTarea(payload);
      // Quita la temporal y agrega la real (sin duplicar si el eco ya la insertó)
      establecerTareas((prev) => {
        const sinTemporal = prev.filter((t) => t.id !== idTemporal);
        return sinTemporal.some((t) => t.id === real.id)
          ? sinTemporal
          : ordenarTareas([real, ...sinTemporal]);
      });
    } catch (error) {
      establecerTareas((prev) => prev.filter((t) => t.id !== idTemporal));
      throw error;
    }
  }, [usuario, salaId]);

  // Ruta rápida de edición de un atributo (prioridad/estado/categoría/descripción):
  // patch optimista local + update de un solo registro. Para "tocar y cambiar".
  const actualizarTareaCampos = useCallback(async (id: number, datos: TareaPayload) => {
    const previas = tareas;
    marcarPendiente(id);
    establecerTareas((prev) => prev.map((t) => (t.id === id ? { ...t, ...datos } : t)));
    try {
      await tareasService.actualizarTarea(id, datos);
    } catch (error) {
      establecerTareas(previas); // Rollback si falla la persistencia
      throw error;
    } finally {
      liberarPendiente(id);
    }
  }, [tareas, marcarPendiente, liberarPendiente]);

  // Mueve una tarea entre el ámbito personal y el de la sala (alterna su room_id)
  const moverTarea = useCallback(async (tareaId: number) => {
    const tarea = tareas.find((t) => t.id === tareaId);
    if (!tarea) return;

    const nuevaSalaId = tarea.room_id ? null : (salaId ?? null);
    marcarPendiente(tareaId);
    establecerTareas((prev) => prev.map((t) => (t.id === tareaId ? { ...t, room_id: nuevaSalaId } : t)));
    try {
      await tareasService.moverTarea(tareaId, nuevaSalaId);
    } finally {
      liberarPendiente(tareaId);
    }
  }, [tareas, salaId, marcarPendiente, liberarPendiente]);

  return { tareas, cargado, recargar, guardarCambios, crearTarea, actualizarTareaCampos, moverTarea };
}
