import { useState } from "react";

/**
 * Hook del mezclador de sonidos ambientales. Es estado puramente local (no toca
 * Supabase): el volumen por sonido y el interruptor general de "ambiente activo".
 *
 * Separa la responsabilidad de mezcla del resto de `MusicPlayer`.
 */
export function useAudioAmbiente() {
  // Volumen (0-100) por id de sonido ambiental
  const [volumenes, establecerVolumenes] = useState<Record<string, number>>({});
  // Interruptor general: si está apagado, se silencia toda la mezcla
  const [activo, establecerActivo] = useState(true);

  // Ajusta el volumen de un sonido puntual sin pisar los demás
  const establecerVolumen = (id: string, valor: number) => {
    establecerVolumenes((previa) => ({ ...previa, [id]: valor }));
  };

  // Hay ambiente sonando si el interruptor está activo y algún volumen es > 0
  const hayAmbienteActivo = activo && Object.values(volumenes).some((v) => v > 0);

  return { volumenes, activo, establecerActivo, establecerVolumen, hayAmbienteActivo };
}
