import { useState } from "react";
import { Check, Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SelectorCategoriaProps {
  // Categoría actual (campo `type` de la tarea)
  value: string;
  // Categorías ya usadas por el usuario (para elegir una existente)
  categorias: string[];
  // Se dispara al elegir una existente o al crear una nueva
  onSeleccionar: (categoria: string) => void;
  // Trigger opcional (asChild). Si no se pasa, se usa un botón por defecto.
  children?: React.ReactNode;
  align?: "start" | "center" | "end";
}

/**
 * Combobox de categoría (presentacional): lista las categorías existentes, filtra
 * al tipear y ofrece crear una nueva con el texto escrito. Reutilizado por el modal
 * de alta y por la edición de categoría en las filas de la tabla.
 */
export function SelectorCategoria({
  value,
  categorias,
  onSeleccionar,
  children,
  align = "start",
}: SelectorCategoriaProps) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, establecerBusqueda] = useState("");

  const consulta = busqueda.trim();
  const filtradas = categorias.filter((c) =>
    c.toLowerCase().includes(consulta.toLowerCase())
  );
  const existeExacta = categorias.some(
    (c) => c.toLowerCase() === consulta.toLowerCase()
  );

  const elegir = (categoria: string) => {
    onSeleccionar(categoria);
    setAbierto(false);
    establecerBusqueda("");
  };

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 font-normal">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            {value || "Categoría"}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align={align}>
        {/* Filtrado manual: necesitamos controlar el ítem "crear nueva" */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar o crear..."
            value={busqueda}
            onValueChange={establecerBusqueda}
          />
          <CommandList>
            {filtradas.length === 0 && !consulta && (
              <CommandEmpty>No hay categorías todavía.</CommandEmpty>
            )}
            {filtradas.length > 0 && (
              <CommandGroup heading="Existentes">
                {filtradas.map((categoria) => (
                  <CommandItem
                    key={categoria}
                    value={categoria}
                    onSelect={() => elegir(categoria)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === categoria ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {categoria}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {consulta && !existeExacta && (
              <CommandGroup heading="Nueva">
                <CommandItem value={`crear-${consulta}`} onSelect={() => elegir(consulta)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear «{consulta}»
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
