import { useCallback, useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import supabase from "@/lib/supabase";
import * as temasService from "@/features/tasks/services/temasService";
import { useAuth } from "@/features/auth/context/useAuth";
import type { IconoTema, Tema } from "@/types/dominio";

/** Orden de la tabla: `position` y, a igualdad, el más viejo primero. */
export function ordenarTemas(arr: Tema[]): Tema[] {
  return [...arr].sort(
    (a, b) => a.position - b.position || a.created_at.localeCompare(b.created_at)
  );
}

/**
 * Hook de dominio para los temas del usuario: carga, realtime (otra pestaña u
 * otro dispositivo) y alta/edición/borrado/orden con optimismo y rollback.
 *
 * Los temas son pocos y cambian poco, así que el realtime hace merge directo,
 * sin el registro de ecos de `useTareas`.
 */
export function useTemas() {
  const { user: usuario } = useAuth();
  const [temas, establecerTemas] = useState<Tema[]>([]);
  const [cargado, establecerCargado] = useState(false);

  const recargar = useCallback(async () => {
    if (!usuario) return;
    try {
      establecerTemas(await temasService.obtenerTemas(usuario.id));
      establecerCargado(true);
    } catch (error) {
      console.error("Error al cargar los temas:", error);
    }
  }, [usuario]);

  const aplicarCambioRealtime = useCallback(
    (payload: RealtimePostgresChangesPayload<Tema>) => {
      establecerTemas((prev) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as Partial<Tema>).id;
          return prev.filter((t) => t.id !== id);
        }
        const nuevo = payload.new as Tema;
        const existe = prev.some((t) => t.id === nuevo.id);
        return ordenarTemas(
          existe ? prev.map((t) => (t.id === nuevo.id ? nuevo : t)) : [...prev, nuevo]
        );
      });
    },
    []
  );

  useEffect(() => {
    if (!usuario) return;
    recargar();
    const canal = supabase
      .channel("realtime-temas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "topics", filter: `user_id=eq.${usuario.id}` },
        aplicarCambioRealtime
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [usuario, recargar, aplicarCambioRealtime]);

  // Alta al final de la lista. Devuelve el tema real (o lanza, p. ej. si el
  // nombre ya existe: ver `temasService.esNombreRepetido`).
  const crearTema = useCallback(
    async (nombre: string, icono?: IconoTema): Promise<Tema | undefined> => {
      if (!usuario) return undefined;
      const position = temas.length ? Math.max(...temas.map((t) => t.position)) + 1 : 0;
      const real = await temasService.crearTema(usuario.id, {
        name: nombre.trim(),
        position,
        ...(icono ? { icon: icono } : {}),
      });
      // El eco del realtime puede llegar antes: no duplicar
      establecerTemas((prev) =>
        prev.some((t) => t.id === real.id) ? prev : ordenarTemas([...prev, real])
      );
      return real;
    },
    [usuario, temas]
  );

  // Cambio optimista de nombre o ícono, con rollback si falla
  const actualizarTema = useCallback(
    async (id: string, datos: { name?: string; icon?: IconoTema }) => {
      const previos = temas;
      const limpio = datos.name !== undefined ? { ...datos, name: datos.name.trim() } : datos;
      establecerTemas((prev) => prev.map((t) => (t.id === id ? { ...t, ...limpio } : t)));
      try {
        await temasService.actualizarTema(id, limpio);
      } catch (error) {
        establecerTemas(previos);
        throw error;
      }
    },
    [temas]
  );

  // Orden manual: recibe los ids en el orden nuevo
  const reordenarTemas = useCallback(
    async (idsEnOrden: string[]) => {
      const previos = temas;
      const posicion = new Map(idsEnOrden.map((id, i) => [id, i]));
      establecerTemas((prev) =>
        ordenarTemas(prev.map((t) => ({ ...t, position: posicion.get(t.id) ?? t.position })))
      );
      try {
        await temasService.reordenarTemas(idsEnOrden);
      } catch (error) {
        establecerTemas(previos);
        throw error;
      }
    },
    [temas]
  );

  // Borrado optimista; las tareas del tema pasan a «General» en la base
  const eliminarTema = useCallback(
    async (id: string) => {
      const previos = temas;
      establecerTemas((prev) => prev.filter((t) => t.id !== id));
      try {
        await temasService.eliminarTema(id);
      } catch (error) {
        establecerTemas(previos);
        throw error;
      }
    },
    [temas]
  );

  return { temas, cargado, recargar, crearTema, actualizarTema, reordenarTemas, eliminarTema };
}
