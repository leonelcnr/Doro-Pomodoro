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
 * Barra de filtro por categoría (opción B del boceto): chips clicables que
 * filtran la lista de tareas. "Todas" muestra todo; cada chip filtra por su
 * categoría. Presentacional: el filtrado real lo hace la página.
 */
export function FiltroCategorias({ categorias, activa, total, onSeleccionar }: FiltroCategoriasProps) {
  // Sin categorías reales más allá de la lista no tiene sentido mostrar la barra
  if (categorias.length === 0) return null;

  const Chip = ({ nombre, cantidad, etiqueta }: { nombre: string; cantidad: number; etiqueta?: string }) => {
    const activo = activa === nombre;
    return (
      <button
        type="button"
        onClick={() => onSeleccionar(nombre)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          activo
            ? "border-violet-500 bg-violet-500 text-white dark:bg-violet-600 dark:border-violet-600"
            : "border-border bg-transparent text-muted-foreground hover:border-violet-500/40 hover:text-foreground"
        )}
      >
        <span className="capitalize">{etiqueta ?? capitalizar(nombre)}</span>
        <span className={cn("text-[10px]", activo ? "text-white/70" : "text-muted-foreground/60")}>{cantidad}</span>
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
