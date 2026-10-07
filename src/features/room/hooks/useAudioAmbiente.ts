import { useState } from "react";

const CLAVE = "doro-mezcla";

function mezclaGuardada(): Record<string, number> {
  try {
    const m = JSON.parse(localStorage.getItem(CLAVE) ?? "{}") as unknown;
    return m && typeof m === "object" ? (m as Record<string, number>) : {};
  } catch {
    return {};
  }
}

/**
 * Hook del mezclador de sonidos ambientales: el volumen por sonido y el interruptor
 * general («Pausar todo»). Es local (no toca Supabase) y la última mezcla se guarda
 * sola en este navegador: al volver a entrar a una sala, suena lo mismo.
 */
export function useAudioAmbiente() {
  // Volumen (0-100) por id de sonido; arranca con la última mezcla
  const [volumenes, establecerVolumenes] = useState<Record<string, number>>(mezclaGuardada);
  const [activo, establecerActivo] = useState(true);

  const establecerVolumen = (id: string, valor: number) => {
    establecerVolumenes((previa) => {
      const nueva = { ...previa, [id]: valor };
      if (!valor) delete nueva[id];
      try {
        localStorage.setItem(CLAVE, JSON.stringify(nueva));
      } catch {
        // Sin almacenamiento la mezcla dura lo que la pestaña
      }
      return nueva;
    });
  };

  const hayAmbienteActivo = activo && Object.values(volumenes).some((v) => v > 0);

  return { volumenes, activo, establecerActivo, establecerVolumen, hayAmbienteActivo };
}
