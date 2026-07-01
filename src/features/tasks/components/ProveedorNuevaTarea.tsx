import { useCallback, useEffect, useState } from "react";
import { useMatch } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/context/useAuth";
import * as tareasService from "@/features/tasks/services/tareasService";
import {
  CATEGORIA_POR_DEFECTO,
  ESTADO_POR_DEFECTO,
  PRIORIDAD_POR_DEFECTO,
} from "@/features/tasks/atributos";
import type { AmbitoTarea } from "@/features/tasks/hooks/useTareas";
import type { TareaPayload } from "@/types/dominio";
import { DialogNuevaTarea } from "./DialogNuevaTarea";

/**
 * Proveedor del alta global de tareas. Monta un listener de Ctrl/⌘+K que abre el
 * modal desde cualquier vista y resuelve la sala activa por la ruta
 * (`/room/:roomId`), sin depender de un store de sala.
 *
 * Inserta directamente vía `tareasService` (no usa `useTareas` para no duplicar la
 * suscripción realtime): el hook de la página ya escucha los cambios y recarga,
 * así que la tarea nueva aparece sola. Se monta una sola vez en `AuthProviderLayout`.
 */
export function ProveedorNuevaTarea() {
  const { user } = useAuth();
  const coincidenciaSala = useMatch("/room/:roomId");
  const salaId = coincidenciaSala?.params.roomId;

  const [abierto, establecerAbierto] = useState(false);
  const [categorias, establecerCategorias] = useState<string[]>([]);

  // Atajos globales para abrir el modal (solo con sesión activa):
  //  - Ctrl/⌘+K (estándar de paleta)
  //  - tecla T suelta (salvo que se esté escribiendo en un campo)
  // También escucha el evento `abrir-nueva-tarea` (lo despacha el botón
  // "Agregar Tarea" de la tabla).
  useEffect(() => {
    if (!user) return;
    const escribiendo = () => {
      const activo = document.activeElement;
      return (
        activo instanceof HTMLElement &&
        (activo.tagName === "INPUT" ||
          activo.tagName === "TEXTAREA" ||
          activo.isContentEditable)
      );
    };
    const alPresionar = (e: KeyboardEvent) => {
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const teclaT = e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !e.altKey && !escribiendo();
      if (cmdK || teclaT) {
        e.preventDefault();
        establecerAbierto(true);
      }
    };
    const alPedirApertura = () => establecerAbierto(true);
    window.addEventListener("keydown", alPresionar);
    window.addEventListener("abrir-nueva-tarea", alPedirApertura);
    return () => {
      window.removeEventListener("keydown", alPresionar);
      window.removeEventListener("abrir-nueva-tarea", alPedirApertura);
    };
  }, [user]);

  // Al abrir, trae las categorías existentes del usuario para el selector.
  useEffect(() => {
    if (!abierto || !user) return;
    tareasService
      .obtenerCategorias(user.id)
      .then(establecerCategorias)
      .catch((error) => console.error("Error al cargar categorías:", error));
  }, [abierto, user]);

  const crear = useCallback(
    async (parcial: TareaPayload, ambito: AmbitoTarea) => {
      if (!user) return;
      const roomId = ambito === "sala" ? (salaId ?? null) : null;
      try {
        await tareasService.crearTarea({
          user_id: user.id,
          room_id: roomId,
          header: parcial.header?.trim() || "Nueva Tarea",
          type: parcial.type?.trim() || CATEGORIA_POR_DEFECTO,
          status: parcial.status || ESTADO_POR_DEFECTO,
          priority: parcial.priority || PRIORIDAD_POR_DEFECTO,
          favorite: false,
          ...(parcial.description ? { description: parcial.description } : {}),
        });
        toast.success("Tarea creada");
      } catch (error) {
        console.error("Error al crear la tarea:", error);
        toast.error("No se pudo crear la tarea");
        throw error; // Mantiene el modal abierto si falló
      }
    },
    [user, salaId]
  );

  if (!user) return null;

  return (
    <DialogNuevaTarea
      open={abierto}
      onOpenChange={establecerAbierto}
      onCrear={crear}
      categorias={categorias}
      haySalaActiva={!!salaId}
    />
  );
}
