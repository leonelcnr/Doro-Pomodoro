import { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import { useAuth } from "@/features/auth/context/AuthContext";

/**
 * Hook de presencia en tiempo real de una sala. Registra al usuario actual en
 * el canal de la sala y mantiene la lista de quiénes están conectados.
 *
 * Antes vivía dentro de `RoomPage`; al extraerlo, la página deja de manejar el
 * canal de presencia a mano.
 */
export function usePresenciaSala(salaId?: string) {
  const { user: usuario } = useAuth();
  // Usuarios actualmente conectados a la sala (presencia en tiempo real)
  const [usuariosEnSala, establecerUsuariosEnSala] = useState<any[]>([]);

  useEffect(() => {
    if (!salaId || !usuario) return;

    // Limpiamos el estado anterior al cambiar de sala (por seguridad)
    establecerUsuariosEnSala([]);

    const canal = supabase.channel(`room-${salaId}`, {
      config: {
        presence: {
          key: usuario.id,
        },
      },
    });

    canal
      .on("presence", { event: "sync" }, () => {
        const estado = canal.presenceState();
        // Extraemos los usuarios únicos
        const usuarios = Object.values(estado).map((infoPresencia: any) => infoPresencia[0]);
        establecerUsuariosEnSala(usuarios);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await canal.track({
            id: usuario.id,
            name: usuario.email?.split("@")[0] || "Usuario",
            avatarUrl: usuario.avatar_url,
          });
        }
      });

    return () => {
      supabase.removeChannel(canal);
    };
  }, [salaId, usuario]);

  return usuariosEnSala;
}
