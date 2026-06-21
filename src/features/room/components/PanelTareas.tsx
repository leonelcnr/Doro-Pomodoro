import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "@/components/data-table";
import { QuickAddTarea } from "@/features/tasks/components/QuickAddTarea";
import { FiltroCategorias } from "@/features/tasks/components/FiltroCategorias";
import { derivarCategorias, CATEGORIA_POR_DEFECTO } from "@/features/tasks/atributos";
import type { AmbitoTarea } from "@/features/tasks/hooks/useTareas";
import type { Tarea, TareaPayload } from "@/types/dominio";

type PanelTareasProps = {
    tareas: Tarea[];
    // Indica si terminó la primera carga (evita disparar el contador antes de tener datos)
    cargado: boolean;
    salaId?: string;
    // Persiste los cambios de la tabla dentro del ámbito indicado (re-lanza errores)
    onGuardarCambios: (nuevoEstadoTareas: Tarea[], ambito: AmbitoTarea) => Promise<void>;
    // Alta rápida en el ámbito indicado (fila inline)
    onCrearTarea: (parcial: TareaPayload, ambito: AmbitoTarea) => Promise<void>;
    // Edición rápida de un atributo de una tarea (tocar para ciclar / categoría)
    onActualizarTarea: (id: number, datos: TareaPayload) => Promise<void>;
    // Mueve una tarea entre el ámbito personal y el de la sala
    onMoverTarea: (tareaId: number) => Promise<void>;
};

/**
 * Panel de tareas de la sala: maneja las pestañas (Mis Tareas / Tareas de la
 * Sala), el contador de tareas de sala "no vistas" y la tabla.
 *
 * Es dueño solo de su estado de UI (pestaña activa, no vistas); los datos y la
 * persistencia llegan por props desde el contenedor (`RoomPage` vía `useTareas`).
 */
export function PanelTareas({ tareas, cargado, salaId, onGuardarCambios, onCrearTarea, onActualizarTarea, onMoverTarea }: PanelTareasProps) {
    const [pestanaTareas, establecerPestanaTareas] = useState<AmbitoTarea>("personal");
    const [cantidadNoVistas, establecerCantidadNoVistas] = useState(0);
    const [categoriaActiva, establecerCategoriaActiva] = useState("Todas");
    const conteoSalaPrevio = useRef<number | null>(null);

    // Cambia de pestaña y resetea el filtro de categoría (las categorías difieren por ámbito)
    const cambiarPestana = useCallback((ambito: AmbitoTarea) => {
        establecerPestanaTareas(ambito);
        establecerCategoriaActiva("Todas");
    }, []);

    // Lleva la cuenta de tareas de sala "no vistas" mientras se está en la pestaña personal
    useEffect(() => {
        if (!cargado) return;

        const conteoSalaActual = tareas.filter(t => t.room_id === salaId).length;

        if (conteoSalaPrevio.current === null) {
            conteoSalaPrevio.current = conteoSalaActual;
            return;
        }

        if (pestanaTareas === "sala") {
            establecerCantidadNoVistas(0);
            conteoSalaPrevio.current = conteoSalaActual;
        } else if (conteoSalaActual !== conteoSalaPrevio.current) {
            // El conteo aumentó (otro usuario agregó o movió una tarea a la sala)
            if (conteoSalaActual > conteoSalaPrevio.current) {
                const cantidadTareasNuevas = conteoSalaActual - conteoSalaPrevio.current;
                establecerCantidadNoVistas(previa => previa + cantidadTareasNuevas);
            }
            conteoSalaPrevio.current = conteoSalaActual;
        }
    }, [tareas, pestanaTareas, salaId, cargado]);

    // Tareas a mostrar según la pestaña activa (personales o de la sala)
    const tareasMostradas = useMemo(() => {
        if (pestanaTareas === "personal") {
            return tareas.filter(t => t.room_id === null);
        } else {
            return tareas.filter(t => t.room_id === salaId);
        }
    }, [tareas, pestanaTareas, salaId]);

    // Categorías y filtro (opción B) sobre las tareas de la pestaña activa
    const categorias = useMemo(() => derivarCategorias(tareasMostradas), [tareasMostradas]);
    const tareasFiltradas = useMemo(
        () => categoriaActiva === "Todas"
            ? tareasMostradas
            : tareasMostradas.filter((t) => (t.type?.trim() || CATEGORIA_POR_DEFECTO) === categoriaActiva),
        [tareasMostradas, categoriaActiva]
    );

    // Persiste los cambios de la tabla en el ámbito de la pestaña activa
    const manejarCambioTareas = useCallback(async (nuevoEstadoTareas: Tarea[]) => {
        try {
            await onGuardarCambios(nuevoEstadoTareas, pestanaTareas);
        } catch (error) {
            console.error("Error al sincronizar las tareas en Supabase:", error);
        }
    }, [onGuardarCambios, pestanaTareas]);

    const manejarMoverTarea = useCallback(async (tareaId: number) => {
        try {
            await onMoverTarea(tareaId);
        } catch (error) {
            console.error("Error al mover la tarea:", error);
        }
    }, [onMoverTarea]);

    // Alta rápida en el ámbito de la pestaña activa (personal o sala)
    const manejarAltaRapida = useCallback(async (parcial: TareaPayload) => {
        try {
            await onCrearTarea(parcial, pestanaTareas);
        } catch (error) {
            console.error("Error al crear la tarea:", error);
        }
    }, [onCrearTarea, pestanaTareas]);

    // Edición rápida de un atributo (tocar para ciclar / elegir categoría)
    const manejarActualizarTarea = useCallback(async (id: number, datos: TareaPayload) => {
        try {
            await onActualizarTarea(id, datos);
        } catch (error) {
            console.error("Error al actualizar la tarea:", error);
        }
    }, [onActualizarTarea]);

    return (
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-0 lg:px-2">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 mb-2">
                    <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
                    <p className="text-muted-foreground text-sm">
                        Aquí tienes una lista de tus tareas de {pestanaTareas === 'personal' ? 'forma personal' : 'sala'}.
                    </p>
                </div>
                <div className="flex border-b border-border/50 mb-4">
                    <button
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${pestanaTareas === 'personal' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => cambiarPestana("personal")}
                    >
                        Mis Tareas
                    </button>
                    <button
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${pestanaTareas === 'sala' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                        onClick={() => cambiarPestana("sala")}
                    >
                        Tareas de la Sala
                        {cantidadNoVistas > 0 && (
                            <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white shadow-sm transition-all dark:bg-violet-600">
                                {cantidadNoVistas}
                            </span>
                        )}
                    </button>
                </div>
                <FiltroCategorias
                    categorias={categorias}
                    activa={categoriaActiva}
                    total={tareasMostradas.length}
                    onSeleccionar={establecerCategoriaActiva}
                />
                <DataTable
                    data={tareasFiltradas}
                    onTasksChange={manejarCambioTareas}
                    onActualizarTarea={manejarActualizarTarea}
                    onMoveTask={manejarMoverTarea}
                    slotAltaRapida={<QuickAddTarea onCrear={manejarAltaRapida} />}
                    key={pestanaTareas} // Forza un re-render del DataTable al cambiar de pestaña
                />
            </div>
        </div>
    );
}
