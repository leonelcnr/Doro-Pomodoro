import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { capitalizar } from "@/features/tasks/atributos";

export interface CategoriaConteo {
  nombre: string;
  cantidad: number;
}

interface FiltroCategoriasProps {
  // Categorías presentes (derivadas del campo `type` de las tareas) con su conteo
  categorias: CategoriaConteo[];
  // Categoría activa ("Todas" muestra todo) o el nombre de una categoría
  activa: string;
  // Total de tareas (para el chip "Todas")
  total: number;
  onSeleccionar: (categoria: string) => void;
}

const TODAS = "Todas";

/**
 * Barra de filtro por categoría (opción B): chips clicables, más prominentes, que
 * filtran la lista de tareas. "Todas" muestra todo; cada chip filtra por su
 * categoría. Al activarse, el chip se rellena con el color de izquierda a derecha.
 * Presentacional: el filtrado real lo hace la página.
 */
export function FiltroCategorias({ categorias, activa, total, onSeleccionar }: FiltroCategoriasProps) {
  // El barrido del relleno corre en JS, así que se apaga a mano cuando el sistema
  // pide menos movimiento.
  const sinMovimiento = useReducedMotion();

  // Sin categorías reales más allá de la lista no tiene sentido mostrar la barra
  if (categorias.length === 0) return null;

  const Chip = ({ nombre, cantidad, etiqueta }: { nombre: string; cantidad: number; etiqueta?: string }) => {
    const activo = activa === nombre;
    return (
      <button
        type="button"
        onClick={() => onSeleccionar(nombre)}
        className={cn(
          "relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50",
          activo
            ? "border-brand-strong text-brand-foreground"
            : "border-border bg-muted text-foreground hover:border-brand/40 hover:bg-accent"
        )}
      >
        {/* Relleno de marca: al activarse barre de izquierda a derecha (sin glow ni deslizamiento) */}
        {activo && (
          <motion.span
            aria-hidden
            className="absolute inset-0 -z-0 origin-left bg-brand-strong"
            initial={sinMovimiento ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: sinMovimiento ? 0 : 0.25, ease: "easeOut" }}
          />
        )}
        <span className="relative z-10">{etiqueta ?? capitalizar(nombre)}</span>
        <span
          className={cn(
            "relative z-10 rounded-full px-1.5 py-px text-[10.5px] font-semibold tabular-nums",
            activo ? "bg-white/20 text-brand-foreground" : "bg-background text-muted-foreground"
          )}
        >
          {cantidad}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip nombre={TODAS} cantidad={total} etiqueta="Todas" />
      {categorias.map((c) => (
        <Chip key={c.nombre} nombre={c.nombre} cantidad={c.cantidad} />
      ))}
    </div>
  );
}
