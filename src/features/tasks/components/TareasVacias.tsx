import { ListTodo } from "lucide-react";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";

interface TareasVaciasProps {
    /**
     * Fila de alta rápida. Se inyecta como slot para que este bloque siga siendo
     * presentacional y no sepa cómo se crean las tareas.
     */
    slotAltaRapida: React.ReactNode;
}

/**
 * Estado vacío de la lista de tareas personales. Reemplaza a la tabla cuando el
 * usuario todavía no anotó nada: la tabla vacía solo mostraba "No hay resultados"
 * en una celda, que es el peor primer contacto posible con la app.
 *
 * Incluye la fila de alta rápida para que el estado vacío sea accionable y no un
 * cartel muerto.
 */
export function TareasVacias({ slotAltaRapida }: TareasVaciasProps) {
    return (
        <Empty className="border border-dashed">
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <ListTodo />
                </EmptyMedia>
                <EmptyTitle>Todavía no anotaste ninguna tarea</EmptyTitle>
                <EmptyDescription>
                    Escribí la primera acá abajo. Podés marcarle prioridad con{" "}
                    <span className="font-mono text-foreground">!alta</span> y categoría con{" "}
                    <span className="font-mono text-foreground">#estudio</span>.
                </EmptyDescription>
            </EmptyHeader>
            <EmptyContent className="w-full max-w-md">{slotAltaRapida}</EmptyContent>
        </Empty>
    );
}

export default TareasVacias;
