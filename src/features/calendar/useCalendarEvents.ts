import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  type CalendarEvent,
  type CreateEventPayload,
  type UpdateEventPayload,
} from "./calendarService";
import { gcalCreate, gcalUpdate, gcalDelete } from "./googleCalendarService";

/** Genera un ID temporal del lado del cliente para los inserts optimistas */
function idTemporal(): string {
  return `__optimistic_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

/**
 * Hook que administra los eventos del calendario con una UI optimista (refleja el
 * cambio al instante y luego confirma/revierte) y sincronización opcional con
 * Google Calendar a través de la Edge Function.
 *
 * @param hasGoogleLinked - Si el usuario tiene una cuenta de Google vinculada para sincronizar.
 */
export function useCalendarEvents(
  hasGoogleLinked: boolean
) {
  const [eventos, establecerEventos] = useState<CalendarEvent[]>([]);
  const [cargando, establecerCargando] = useState(true);

  // ── Carga inicial al montar ────────────────────────────────
  useEffect(() => {
    let cancelado = false;
    establecerCargando(true);
    fetchEvents()
      .then((data) => { if (!cancelado) establecerEventos(data); })
      .catch((err) => {
        if (!cancelado) {
          console.error(err);
          toast.error("Error al cargar eventos");
        }
      })
      .finally(() => { if (!cancelado) establecerCargando(false); });
    return () => { cancelado = true; };
  }, []);

  // ── Crear (optimista) ──────────────────────────────────────
  const manejarCrear = useCallback(
    async (datos: CreateEventPayload): Promise<CalendarEvent | null> => {
      const idOptimista = idTemporal();
      const eventoOptimista: CalendarEvent = {
        id: idOptimista,
        user_id: "",
        title: datos.title,
        event_date: datos.event_date,
        type: datos.type,
        description: datos.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. Inserción optimista (se muestra antes de confirmar en el servidor)
      establecerEventos((previos) =>
        [...previos, eventoOptimista].sort((a, b) =>
          a.event_date.localeCompare(b.event_date)
        )
      );

      const idToast = toast.loading("Guardando evento…", {
        description: datos.title,
      });

      // 2. En segundo plano: persistir en Supabase + opcionalmente en Google Calendar
      const trabajoEnSegundoPlano = async (): Promise<CalendarEvent> => {
        const nuevoEvento = await createEvent(datos);

        if (hasGoogleLinked) {
          try {
            const idGoogle = await gcalCreate({
              summary: nuevoEvento.title,
              description: nuevoEvento.type,
              date: nuevoEvento.event_date,
            });
            const conIdGoogle = await updateEvent(nuevoEvento.id, {
              google_event_id: idGoogle,
            });

            establecerEventos((previos) =>
              previos
                .map((e) => (e.id === idOptimista ? conIdGoogle : e))
                .sort((a, b) => a.event_date.localeCompare(b.event_date))
            );
            return conIdGoogle;
          } catch (errorGcal) {
            console.error("Falló la sincronización con Google Calendar:", errorGcal);
            // Fallo silencioso si no tiene los permisos o no lo vinculó completamente.
          }
        }

        // Reemplazamos la entrada optimista por el evento real
        establecerEventos((previos) =>
          previos
            .map((e) => (e.id === idOptimista ? nuevoEvento : e))
            .sort((a, b) => a.event_date.localeCompare(b.event_date))
        );
        return nuevoEvento;
      };

      try {
        const resultado = await trabajoEnSegundoPlano();
        const conGoogle = !!resultado.google_event_id;
        toast.success(
          conGoogle ? "Sincronizado con Google Calendar" : "Evento guardado",
          { id: idToast, description: resultado.title }
        );
        return resultado;
      } catch (err: unknown) {
        // Ante un error, revertimos la inserción optimista
        establecerEventos((previos) => previos.filter((e) => e.id !== idOptimista));
        toast.error("No se pudo guardar el evento", {
          id: idToast,
          description: err instanceof Error ? err.message : undefined,
        });
        return null;
      }
    },
    [hasGoogleLinked]
  );

  // ── Actualizar (optimista) ─────────────────────────────────
  const manejarActualizar = useCallback(
    async (id: string, datos: UpdateEventPayload): Promise<CalendarEvent | null> => {
      // Guardamos una instantánea del evento por si hay que revertir
      let instantanea: CalendarEvent | undefined;

      establecerEventos((previos) => {
        instantanea = previos.find((e) => e.id === id);
        return previos
          .map((e) =>
            e.id === id
              ? { ...e, ...datos, updated_at: new Date().toISOString() }
              : e
          )
          .sort((a, b) => a.event_date.localeCompare(b.event_date));
      });

      const idToast = toast.loading("Actualizando evento…");

      const trabajoEnSegundoPlano = async (): Promise<CalendarEvent> => {
        const actualizado = await updateEvent(id, datos);

        if (hasGoogleLinked && actualizado.google_event_id) {
          try {
            await gcalUpdate(actualizado.google_event_id, {
              summary: actualizado.title,
              description: actualizado.type,
              date: actualizado.event_date,
            });
          } catch (errorGcal) {
            console.error("Falló la actualización en Google Calendar:", errorGcal);
          }
        }

        establecerEventos((previos) =>
          previos
            .map((e) => (e.id === id ? actualizado : e))
            .sort((a, b) => a.event_date.localeCompare(b.event_date))
        );
        return actualizado;
      };

      try {
        const resultado = await trabajoEnSegundoPlano();
        toast.success("Evento actualizado", { id: idToast });
        return resultado;
      } catch (err: unknown) {
        if (instantanea) {
          establecerEventos((previos) =>
            previos
              .map((e) => (e.id === id ? instantanea! : e))
              .sort((a, b) => a.event_date.localeCompare(b.event_date))
          );
        }
        toast.error("No se pudo actualizar el evento", {
          id: idToast,
          description: err instanceof Error ? err.message : undefined,
        });
        return null;
      }
    },
    [hasGoogleLinked]
  );

  // ── Eliminar (optimista) ───────────────────────────────────
  const manejarEliminar = useCallback(
    async (id: string): Promise<boolean> => {
      let eventoEliminado: CalendarEvent | undefined;

      establecerEventos((previos) => {
        eventoEliminado = previos.find((e) => e.id === id);
        return previos.filter((e) => e.id !== id);
      });

      const idToast = toast.loading("Eliminando evento…");

      const trabajoEnSegundoPlano = async (): Promise<void> => {
        if (hasGoogleLinked && eventoEliminado?.google_event_id) {
          try {
            await gcalDelete(eventoEliminado.google_event_id);
          } catch (errorGcal) {
            console.error("Falló la eliminación en Google Calendar:", errorGcal);
          }
        }
        await deleteEvent(id);
      };

      try {
        await trabajoEnSegundoPlano();
        toast.success("Evento eliminado", { id: idToast });
        return true;
      } catch (err: unknown) {
        if (eventoEliminado) {
          establecerEventos((previos) =>
            [...previos, eventoEliminado!].sort((a, b) =>
              a.event_date.localeCompare(b.event_date)
            )
          );
        }
        toast.error("No se pudo eliminar el evento", {
          id: idToast,
          description: err instanceof Error ? err.message : undefined,
        });
        return false;
      }
    },
    [hasGoogleLinked]
  );

  return {
    eventos,
    cargando,
    crearEvento: manejarCrear,
    actualizarEvento: manejarActualizar,
    eliminarEvento: manejarEliminar,
  };
}
