import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ChipPrioridad,
  ChipEstado,
  BadgePrioridad,
  BadgeEstado,
  BadgeCategoria,
} from "./ChipAtributo";
import { SelectorCategoria } from "./SelectorCategoria";
import { parsearTokensTarea } from "@/features/tasks/tokens";
import {
  type Prioridad,
  type EstadoTarea,
  siguientePrioridad,
  siguienteEstado,
  PRIORIDAD_POR_DEFECTO,
  ESTADO_POR_DEFECTO,
  CATEGORIA_POR_DEFECTO,
} from "@/features/tasks/atributos";
import type { AmbitoTarea } from "@/features/tasks/hooks/useTareas";
import type { TareaPayload } from "@/types/dominio";

interface DialogNuevaTareaProps {
  open: boolean;
  onOpenChange: (abierto: boolean) => void;
  // Crea la tarea en el ámbito elegido (personal o sala)
  onCrear: (parcial: TareaPayload, ambito: AmbitoTarea) => void | Promise<void>;
  categorias: string[];
  // Solo se permite elegir "Esta sala" cuando hay una sala activa
  haySalaActiva: boolean;
}

/**
 * Modal global de alta de tareas (Ctrl/⌘+K o la tecla T, desde cualquier vista).
 * Inspirado en la paleta de comandos del boceto: input destacado con tokens,
 * preview en vivo de las etiquetas que se van a crear, atributos clicables
 * (prioridad/estado ciclan; categoría con selector) y elección de ámbito.
 * Los chips son la fuente de verdad; los tokens del título solo tienen
 * precedencia si están presentes al crear.
 */
export function DialogNuevaTarea({
  open,
  onOpenChange,
  onCrear,
  categorias,
  haySalaActiva,
}: DialogNuevaTareaProps) {
  const [titulo, establecerTitulo] = useState("");
  const [descripcion, establecerDescripcion] = useState("");
  const [prioridad, establecerPrioridad] = useState<Prioridad>(PRIORIDAD_POR_DEFECTO);
  const [estado, establecerEstado] = useState<EstadoTarea>(ESTADO_POR_DEFECTO);
  const [categoria, establecerCategoria] = useState<string>(CATEGORIA_POR_DEFECTO);
  const [ambito, establecerAmbito] = useState<AmbitoTarea>("personal");
  const [guardando, establecerGuardando] = useState(false);

  // Resetea el formulario cada vez que se abre; fuerza Personal si no hay sala.
  useEffect(() => {
    if (open) {
      establecerTitulo("");
      establecerDescripcion("");
      establecerPrioridad(PRIORIDAD_POR_DEFECTO);
      establecerEstado(ESTADO_POR_DEFECTO);
      establecerCategoria(CATEGORIA_POR_DEFECTO);
      establecerAmbito("personal");
      establecerGuardando(false);
    }
  }, [open]);

  // Resuelve lo que se va a crear: el título limpio + atributos finales. Los
  // tokens del título ganan solo si están presentes; sino mandan los chips.
  const resultado = useMemo(() => {
    const parsed = parsearTokensTarea(titulo);
    return {
      header: parsed.header || titulo.trim(),
      priority: parsed.priority !== PRIORIDAD_POR_DEFECTO ? parsed.priority : prioridad,
      type: parsed.type !== CATEGORIA_POR_DEFECTO ? parsed.type : categoria,
    };
  }, [titulo, prioridad, categoria]);

  const crear = async () => {
    if (!resultado.header) return;
    const descripcionLimpia = descripcion.trim();

    establecerGuardando(true);
    try {
      await onCrear(
        {
          header: resultado.header,
          priority: resultado.priority,
          status: estado,
          type: resultado.type,
          ...(descripcionLimpia ? { description: descripcionLimpia } : {}),
        },
        ambito
      );
      onOpenChange(false);
    } finally {
      establecerGuardando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[10vh] grid w-[calc(100%-2rem)] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-[600px]">
        <DialogHeader className="px-5 pt-5 text-left">
          <DialogTitle className="text-base">Nueva tarea</DialogTitle>
          <DialogDescription className="sr-only">
            Crear una nueva tarea con título, descripción y atributos.
          </DialogDescription>
        </DialogHeader>

        {/* Campo principal estilo paleta: "+" violeta + input grande */}
        <div className="mx-5 mt-3 flex items-center gap-3 rounded-lg border bg-muted/30 py-2.5 pl-3 pr-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-600 dark:text-violet-400">
            <Plus className="size-4" />
          </span>
          <Input
            autoFocus
            value={titulo}
            onChange={(e) => establecerTitulo(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                crear();
              }
            }}
            placeholder="¿Qué tenés que hacer?  !alta  #lectura"
            maxLength={160}
            className="h-auto border-0 !bg-transparent px-1 py-0 text-base focus-visible:ring-0 md:text-base "
          />
        </div>

        {/* Preview en vivo de lo que se va a crear */}
        {resultado.header && (
          <div className="flex flex-wrap items-center gap-2 px-5 pt-3 text-xs text-muted-foreground">
            <span className="text-muted-foreground/70">Se creará:</span>
            <span className="font-medium text-foreground">{resultado.header}</span>
            <BadgeEstado valor={estado} />
            <BadgePrioridad valor={resultado.priority} />
            <BadgeCategoria valor={resultado.type} />
          </div>
        )}

        <div className="flex flex-col gap-5 px-5 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nueva-tarea-descripcion" className="text-xs text-muted-foreground">
              Descripción
            </Label>
            <Textarea
              id="nueva-tarea-descripcion"
              value={descripcion}
              onChange={(e) => establecerDescripcion(e.target.value)}
              placeholder="Detalles opcionales de la tarea…"
              className="min-h-16 resize-y"
            />
          </div>

          {/* Atributos y Dónde en una sola fila (el modal es ancho) */}
          <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Atributos</Label>
              <div className="flex flex-wrap items-center gap-2">
                <ChipPrioridad
                  valor={prioridad}
                  onClick={() => establecerPrioridad((p) => siguientePrioridad(p))}
                />
                <ChipEstado
                  valor={estado}
                  onClick={() => establecerEstado((s) => siguienteEstado(s))}
                />
                <SelectorCategoria
                  value={categoria}
                  categorias={categorias}
                  onSeleccionar={establecerCategoria}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Dónde</Label>
              <div className="inline-flex w-fit rounded-lg border p-0.5">
                <button
                  type="button"
                  onClick={() => establecerAmbito("personal")}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    ambito === "personal"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Personal
                </button>
                <button
                  type="button"
                  disabled={!haySalaActiva}
                  onClick={() => establecerAmbito("sala")}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                    ambito === "sala"
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                    !haySalaActiva && "cursor-not-allowed opacity-40 hover:text-muted-foreground"
                  )}
                  title={haySalaActiva ? undefined : "Entrá a una sala para asignarla allí"}
                >
                  Esta sala
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pie estilo paleta: atajos de tokens + acción */}
        <div className="flex items-center gap-3 border-t bg-muted/30 px-5 py-3 text-xs text-muted-foreground">
          <span className="hidden items-center gap-1.5 sm:flex">
            <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">!alta</kbd>
            prioridad
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <kbd className="rounded border bg-background px-1.5 py-0.5 font-mono text-[10px]">#tipo</kbd>
            categoría
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" size="sm" onClick={crear} disabled={guardando || !resultado.header}>
              Crear tarea
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
