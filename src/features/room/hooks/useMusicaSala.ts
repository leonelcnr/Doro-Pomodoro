import { useEffect, useState } from "react";
import { toast } from "sonner";
import * as salasService from "@/features/room/services/salasService";
import type { EstadoMusicaSala } from "@/types/dominio";

/**
 * Hook de la música compartida de una sala. Carga el estado inicial, escucha
 * los cambios en tiempo real (`music_state`) y expone una función para
 * actualizarlo (optimista en local + persistencia en Supabase).
 *
 * Antes vivía dentro de `MusicPlayer`; al extraerlo, el componente deja de
 * hablar con Supabase y se queda solo con la UI.
 */
export function useMusicaSala(salaId?: string) {
  const [estadoSala, establecerEstadoSala] = useState<EstadoMusicaSala>({ url: "", isPlaying: false });

  // Carga inicial + suscripción en tiempo real
  useEffect(() => {
    if (!salaId) return;

    let activo = true;

    salasService.obtenerEstadoMusica(salaId)
      .then((estado) => {
        if (activo && estado) establecerEstadoSala(estado);
      })
      .catch((error) => {
        console.error("Error al cargar la música de la sala:", error);
      });

    const desuscribir = salasService.suscribirCambiosSala(salaId, (fila) => {
      if (fila.music_state) establecerEstadoSala(fila.music_state);
    });

    return () => {
      activo = false;
      desuscribir();
    };
  }, [salaId]);

  // Actualiza el estado en local (optimista) y lo persiste/sincroniza en Supabase
  const actualizarEstadoSala = async (nuevoEstado: Partial<EstadoMusicaSala>) => {
    if (!salaId) return;
    const estadoFinal = { ...estadoSala, ...nuevoEstado, updatedAt: new Date().toISOString() };
    establecerEstadoSala(estadoFinal);

    try {
      await salasService.guardarEstadoMusica(salaId, estadoFinal);
    } catch (error) {
      console.error("Error de Supabase sincronizando música:", error);
      toast.error("No se pudo sincronizar la música con la sala.");
    }
  };

  return { estadoSala, actualizarEstadoSala };
}
