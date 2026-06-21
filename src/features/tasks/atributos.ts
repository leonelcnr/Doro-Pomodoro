// Atributos canónicos de una tarea (prioridad y estado) y sus helpers.
//
// Centraliza lo que antes estaba inline y duplicado en `data-table.tsx`: el
// orden de los valores, la normalización del legado en inglés, el ciclado al
// "siguiente" estado (para tocar y cambiar) y los mapas de color/ícono que
// comparten las celdas de la tabla, los chips del alta y el modal.
//
// Canónico en español para TODA escritura nueva (cumple "todo en español";
// `priority`/`status` no son contratos rígidos de Supabase, solo texto libre).
// El normalizador mantiene compatibilidad con filas viejas guardadas en inglés.

import {
  Flag,
  CircleDashed,
  Hourglass,
  CircleCheck,
  type LucideIcon,
} from "lucide-react";

export type Prioridad = "Alta" | "Media" | "Baja";
export type EstadoTarea = "Sin Empezar" | "En Progreso" | "Completada";

// Orden canónico; el ciclado avanza por estos arrays (y vuelve al inicio).
export const PRIORIDADES: Prioridad[] = ["Alta", "Media", "Baja"];
export const ESTADOS: EstadoTarea[] = ["Sin Empezar", "En Progreso", "Completada"];

// Defaults cuando el alta no especifica nada (mismos que usa hoy la app/DB).
export const PRIORIDAD_POR_DEFECTO: Prioridad = "Media";
export const ESTADO_POR_DEFECTO: EstadoTarea = "Sin Empezar";
export const CATEGORIA_POR_DEFECTO = "General";

// Mapea cualquier valor (inglés legado o español) a la prioridad canónica.
export function normalizarPrioridad(valor?: string | null): Prioridad {
  switch ((valor ?? "").toLowerCase()) {
    case "high":
    case "alta":
      return "Alta";
    case "low":
    case "baja":
      return "Baja";
    case "medium":
    case "media":
      return "Media";
    default:
      return PRIORIDAD_POR_DEFECTO;
  }
}

// Mapea cualquier valor al estado canónico (todo lo no reconocido cae al default).
export function normalizarEstado(valor?: string | null): EstadoTarea {
  switch (valor) {
    case "Completada":
      return "Completada";
    case "En Progreso":
      return "En Progreso";
    case "Sin Empezar":
      return "Sin Empezar";
    default:
      return ESTADO_POR_DEFECTO;
  }
}

// Devuelve la prioridad siguiente en el ciclo (Alta → Media → Baja → Alta).
export function siguientePrioridad(valor?: string | null): Prioridad {
  const indice = PRIORIDADES.indexOf(normalizarPrioridad(valor));
  return PRIORIDADES[(indice + 1) % PRIORIDADES.length]!;
}

// Devuelve el estado siguiente en el ciclo (Sin Empezar → En Progreso → Completada → …).
export function siguienteEstado(valor?: string | null): EstadoTarea {
  const indice = ESTADOS.indexOf(normalizarEstado(valor));
  return ESTADOS[(indice + 1) % ESTADOS.length]!;
}

// Metadatos visuales de un atributo:
//  - `icono`: ícono de lucide
//  - `clase`: color del ícono (para chips outline y celdas de la tabla)
//  - `badge`: clases de píldora con fondo tenue (para el preview "Se creará…")
// Paleta alineada al boceto: Alta=rojo · Media=ámbar · Baja=celeste;
// En Progreso=violeta · Completada=esmeralda · Sin Empezar=neutro.
type InfoAtributo = { icono: LucideIcon; clase: string; badge: string };

export const INFO_PRIORIDAD: Record<Prioridad, InfoAtributo> = {
  Alta: {
    icono: Flag,
    clase: "text-red-500 dark:text-red-400",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  Media: {
    icono: Flag,
    clase: "text-amber-500 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  Baja: {
    icono: Flag,
    clase: "text-sky-500 dark:text-sky-400",
    badge: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
  },
};

export const INFO_ESTADO: Record<EstadoTarea, InfoAtributo> = {
  Completada: {
    icono: CircleCheck,
    clase: "text-emerald-500 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  "En Progreso": {
    icono: Hourglass,
    clase: "text-violet-500 dark:text-violet-400",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  },
  "Sin Empezar": {
    icono: CircleDashed,
    clase: "text-muted-foreground",
    badge: "bg-muted text-muted-foreground border-border",
  },
};

// Capitaliza la primera letra de cada palabra (para mostrar categorías "lindas").
export function capitalizar(texto: string): string {
  return texto.replace(/\b\p{L}/gu, (c) => c.toUpperCase());
}

// Deriva las categorías presentes en un conjunto de tareas (campo `type`) con su
// conteo, ordenadas alfabéticamente. Alimenta el filtro por categoría.
export function derivarCategorias(
  tareas: { type?: string | null }[]
): { nombre: string; cantidad: number }[] {
  const conteo = new Map<string, number>();
  for (const t of tareas) {
    const nombre = t.type?.trim() || CATEGORIA_POR_DEFECTO;
    conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1);
  }
  return [...conteo.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}
