import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { parsearTokensTarea } from "@/features/tasks/tokens";
import { CATEGORIA_POR_DEFECTO, PRIORIDAD_POR_DEFECTO } from "@/features/tasks/atributos";
import { BadgePrioridad } from "./ChipAtributo";
import type { TareaPayload } from "@/types/dominio";

interface QuickAddTareaProps {
  // Crea la tarea con los campos derivados de los tokens (header/priority/type)
  onCrear: (parcial: TareaPayload) => void;
}

// True si el foco está en un campo de texto (para no robar la tecla `N` mientras se escribe)
function focoEnCampo() {
  const activo = document.activeElement;
  return (
    activo instanceof HTMLElement &&
    (activo.tagName === "INPUT" ||
      activo.tagName === "TEXTAREA" ||
      activo.isContentEditable)
  );
}

/**
 * Alta rápida inline (patrón "fila + tokens"): un input que parsea tokens en vivo
 * (`!alta`/`#categoria`) con preview, crea con Enter y mantiene el foco para
 * encadenar varias. La tecla `N` lo enfoca desde cualquier parte de la vista.
 */
export function QuickAddTarea({ onCrear }: QuickAddTareaProps) {
  const [texto, establecerTexto] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => parsearTokensTarea(texto), [texto]);
  const hayPrioridad = parsed.priority !== PRIORIDAD_POR_DEFECTO;
  const hayCategoria = parsed.type !== CATEGORIA_POR_DEFECTO;

  // La tecla `N` enfoca el input y desplaza la vista hasta la lista de tareas
  // (salvo que ya se esté escribiendo en otro campo).
  useEffect(() => {
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "n" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (focoEnCampo()) return;
      e.preventDefault();
      contenedorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", alPresionar);
    return () => window.removeEventListener("keydown", alPresionar);
  }, []);

  const crear = () => {
    if (!parsed.header.trim()) return;
    onCrear({ header: parsed.header, priority: parsed.priority, type: parsed.type });
    establecerTexto(""); // Limpia y mantiene el foco para encadenar la siguiente
    inputRef.current?.focus();
  };

  return (
    <div
      ref={contenedorRef}
      className="flex scroll-mt-24 flex-col gap-2 rounded-lg border border-dashed bg-muted/30 p-2 transition-colors focus-within:border-solid focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10 sm:flex-row sm:items-center"
    >
      <div className="relative flex flex-1 items-center">
        <Plus className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={texto}
          onChange={(e) => establecerTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              crear();
            }
          }}
          placeholder="Agregar tarea… usa !alta y #categoría"
          maxLength={160}
          className="border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
        />
        {/* Atajo: indica que `N` enfoca esta fila cuando está vacía */}
        {!texto && (
          <kbd className="pointer-events-none absolute right-3 hidden h-5 select-none items-center rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
            N
          </kbd>
        )}
      </div>

      {/* Preview en vivo de los tokens detectados */}
      {(hayPrioridad || hayCategoria) && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          {hayPrioridad && <BadgePrioridad valor={parsed.priority} />}
          {hayCategoria && (
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              #{parsed.type}
            </span>
          )}
        </div>
      )}

      <Button
        type="button"
        size="sm"
        onClick={crear}
        disabled={!parsed.header.trim()}
        className="h-8 bg-purple-500 hover:bg-purple-600 text-white dark:bg-purple-600 dark:hover:bg-purple-700"
      >
        Agregar
      </Button>
    </div>
  );
}
