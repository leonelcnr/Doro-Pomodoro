// Parser de "tokens rápidos" para el alta de tareas.
//
// Permite escribir una tarea en una sola línea y derivar atributos del texto:
//   "Leer cap 3 !alta #lectura"  →  header "Leer cap 3", prioridad Alta, categoría "lectura"
// Tokens soportados:
//   - !alta | !media | !baja  (y sus equivalentes en inglés !high/!medium/!low) → prioridad
//   - #categoria                                                                 → categoría (campo `type`)
// Lo que no es token forma el título. Sin tokens, caen los defaults.

import {
  type Prioridad,
  PRIORIDAD_POR_DEFECTO,
  CATEGORIA_POR_DEFECTO,
} from "./atributos";

export interface TokensTarea {
  header: string;
  priority: Prioridad;
  type: string;
}

const MAPA_PRIORIDAD_TOKEN: Record<string, Prioridad> = {
  alta: "Alta",
  high: "Alta",
  media: "Media",
  medium: "Media",
  baja: "Baja",
  low: "Baja",
};

export function parsearTokensTarea(crudo: string): TokensTarea {
  let priority: Prioridad = PRIORIDAD_POR_DEFECTO;
  let type = CATEGORIA_POR_DEFECTO;
  const restantes: string[] = [];

  for (const palabra of crudo.split(/\s+/)) {
    if (palabra.startsWith("!") && palabra.length > 1) {
      const prioridadToken = MAPA_PRIORIDAD_TOKEN[palabra.slice(1).toLowerCase()];
      if (prioridadToken) {
        priority = prioridadToken;
        continue;
      }
    }
    if (palabra.startsWith("#") && palabra.length > 1) {
      type = palabra.slice(1);
      continue;
    }
    restantes.push(palabra);
  }

  return { header: restantes.join(" ").trim(), priority, type };
}
