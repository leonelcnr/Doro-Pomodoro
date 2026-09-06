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
 * Barra de filtro por categoría: solo la opción activa lleva cápsula, y en gris.
 * Las demás son texto que se ilumina al pasar por encima.
 *
 * Antes cada opción era una píldora con borde, la activa se rellenaba de violeta
 * con una animación de barrido, y el conteo era otra cápsula anidada dentro de la
 * primera. Eso dejaba N cápsulas en pantalla compitiendo entre sí, y usaba el
 * violeta de marca para algo que no es la marca.
 *
 * No se usan pestañas subrayadas a propósito: `PanelTareas` ya las usa para
 * elegir ámbito (Mis Tareas / Tareas de la Sala) justo encima de este filtro. El
 * ámbito es el eje principal y la categoría un refinamiento dentro de él, así que
 * tienen que verse distinto y pesar distinto.
 *
 * Ojo: la animación de aparición al cambiar de categoría no vive acá, sino en el
 * `AnimatePresence` que envuelve la tabla en `Home` y en `PanelTareas`.
 */
export function FiltroCategorias({ categorias, activa, total, onSeleccionar }: FiltroCategoriasProps) {
  // Sin categorías reales más allá de la lista no tiene sentido mostrar la barra
  if (categorias.length === 0) return null;

  const Chip = ({ nombre, cantidad, etiqueta }: { nombre: string; cantidad: number; etiqueta?: string }) => {
    const activo = activa === nombre;
    return (
      <button
        type="button"
        aria-pressed={activo}
        onClick={() => onSeleccionar(nombre)}
        className={cn(
          "inline-flex items-baseline gap-1.5 rounded-full px-3 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          activo
            ? "bg-muted font-semibold text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <span>{etiqueta ?? capitalizar(nombre)}</span>
        <span className="text-xs tabular-nums opacity-70">{cantidad}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <Chip nombre={TODAS} cantidad={total} etiqueta="Todas" />
      {categorias.map((c) => (
        <Chip key={c.nombre} nombre={c.nombre} cantidad={c.cantidad} />
      ))}
    </div>
  );
}
