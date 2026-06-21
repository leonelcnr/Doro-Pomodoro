import { cn } from "@/lib/utils";
import {
  normalizarPrioridad,
  normalizarEstado,
  capitalizar,
  INFO_PRIORIDAD,
  INFO_ESTADO,
} from "@/features/tasks/atributos";

const baseChip =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none";

/**
 * Chip clicable de prioridad. Muestra el ícono/color de la prioridad y, al
 * tocarlo, dispara `onClick` (que el llamador usa para ciclar al siguiente valor).
 * Presentacional: no decide el siguiente estado, solo refleja `valor`.
 */
export function ChipPrioridad({
  valor,
  onClick,
  className,
}: {
  valor?: string | null;
  onClick?: () => void;
  className?: string;
}) {
  const prioridad = normalizarPrioridad(valor);
  const { icono: Icono, clase } = INFO_PRIORIDAD[prioridad];
  // Ícono (color del nivel) + palabra, con el mismo hover de los demás chips
  return (
    <button type="button" onClick={onClick} className={cn(baseChip, className)} title="Cambiar prioridad">
      <Icono className={cn("h-3.5 w-3.5", clase)} />
      <span>{prioridad}</span>
    </button>
  );
}

/**
 * Chip clicable de estado. Igual que el de prioridad pero para el estado de la tarea.
 */
export function ChipEstado({
  valor,
  onClick,
  className,
}: {
  valor?: string | null;
  onClick?: () => void;
  className?: string;
}) {
  const estado = normalizarEstado(valor);
  const { icono: Icono, clase } = INFO_ESTADO[estado];
  return (
    <button type="button" onClick={onClick} className={cn(baseChip, className)} title="Cambiar estado">
      <Icono className={cn("h-3.5 w-3.5", clase)} />
      <span>{estado}</span>
    </button>
  );
}

// ---- Badges de solo lectura (píldoras de color) para el preview "Se creará…" ----

const baseBadge =
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap";

/** Badge de prioridad (no interactivo): ícono del color del nivel + palabra. */
export function BadgePrioridad({ valor }: { valor?: string | null }) {
  const prioridad = normalizarPrioridad(valor);
  const { icono: Icono, clase } = INFO_PRIORIDAD[prioridad];
  return (
    <span className={cn(baseBadge, "border-border bg-transparent text-foreground")}>
      <Icono className={cn("h-3 w-3", clase)} />
      {prioridad}
    </span>
  );
}

/** Píldora de color del estado (no interactiva). */
export function BadgeEstado({ valor }: { valor?: string | null }) {
  const estado = normalizarEstado(valor);
  const { icono: Icono, badge } = INFO_ESTADO[estado];
  return (
    <span className={cn(baseBadge, badge)}>
      <Icono className="h-3 w-3" />
      {estado}
    </span>
  );
}

/** Píldora de la categoría (outline, capitalizada). */
export function BadgeCategoria({ valor }: { valor: string }) {
  return (
    <span className={cn(baseBadge, "border-border bg-transparent text-muted-foreground capitalize")}>
      {capitalizar(valor)}
    </span>
  );
}
