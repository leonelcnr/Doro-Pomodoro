import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { DataTable } from "@/components/data-table"
import { EncabezadoApp } from "@/components/encabezado/EncabezadoApp"

import SalaNueva from "../features/home/components/SalaNueva"
import { HeroEnfoque } from "@/features/home/components/HeroEnfoque"
import { obtenerSaludo } from "@/features/home/saludo"
import { useTareas } from "@/features/tasks/hooks/useTareas"
import { QuickAddTarea } from "@/features/tasks/components/QuickAddTarea"
import { TareasVacias } from "@/features/tasks/components/TareasVacias"
import { FiltroCategorias } from "@/features/tasks/components/FiltroCategorias"
import { derivarCategorias, CATEGORIA_POR_DEFECTO } from "@/features/tasks/atributos"
import { useAuth } from "@/features/auth/context/useAuth"
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import type { Tarea } from "@/types/dominio"

// Meta diaria de minutos de enfoque que llena el anillo del hero.
const META_DIARIA_MINUTOS = 120;

/**
 * Arma la descripción de un toast de error. Los errores de Supabase
 * (PostgrestError) traen `message` y `details`, pero también puede llegar
 * cualquier otra cosa, así que se estrecha el tipo sin asumir.
 */
const describirError = (error: unknown): string => {
    const err = error as { message?: string; details?: string };
    const mensaje = err?.message ?? "desconocido";
    return err?.details ? `${mensaje} (Detalles: ${err.details})` : mensaje;
};

/**
 * Página de inicio: hero con el resumen de enfoque del día, panel para
 * crear/unirse a salas y la lista de tareas personales del usuario,
 * sincronizada en tiempo real con Supabase.
 */
const Home = () => {
    // Sin salaId: el hook trae y escucha solo las tareas personales del usuario
    const { tareas, guardarCambios, crearTarea, actualizarTareaCampos } = useTareas();

    // Respeta `prefers-reduced-motion`: las animaciones de motion corren en JS y no
    // las alcanza la regla CSS global de index.css.
    const sinMovimiento = useReducedMotion();

    // Filtro por categoría (opción B): chips derivados de las tareas
    const [categoriaActiva, establecerCategoriaActiva] = useState("Todas");
    const categorias = useMemo(() => derivarCategorias(tareas), [tareas]);
    const tareasFiltradas = useMemo(
        () => categoriaActiva === "Todas"
            ? tareas
            : tareas.filter((t) => (t.type?.trim() || CATEGORIA_POR_DEFECTO) === categoriaActiva),
        [tareas, categoriaActiva]
    );

    // Datos vivos del hero: reutiliza el hook del dashboard (racha + hoy), que ya
    // trae todo con react-query e invalidación en tiempo real.
    const { user } = useAuth();
    const { stats, statsByRange, isLoading: cargandoStats } = useDashboardStats(user?.id);
    const primerNombre = !user || user.isAnonymous ? "" : (user.name?.split(" ")[0] ?? "");

    // Alta rápida personal (fila inline).
    const manejarAltaRapida = async (parcial: Partial<Tarea>) => {
        try {
            await crearTarea(parcial, "personal");
        } catch (error) {
            console.error("Error al crear la tarea:", error);
            toast.error("No se pudo crear la tarea", { description: describirError(error) });
        }
    };

    // Edición rápida de un atributo (tocar para ciclar / elegir categoría)
    const manejarActualizarTarea = async (id: number, datos: Partial<Tarea>) => {
        try {
            await actualizarTareaCampos(id, datos);
        } catch (error) {
            console.error("Error al actualizar la tarea:", error);
            toast.error("No se pudo actualizar la tarea", { description: describirError(error) });
        }
    };

    // Persiste en Supabase los cambios hechos en la tabla de tareas (edición, alta, baja)
    const manejarCambioTareas = async (nuevoEstadoTareas: Tarea[]) => {
        try {
            await guardarCambios(nuevoEstadoTareas, "personal");
        } catch (error: unknown) {
            console.error("Error al guardar las tareas en Supabase:", error);
            toast.error("No se pudo guardar la tarea", { description: describirError(error) });
        }
    };

    return (
        <div className="flex min-h-dvh flex-col">
            <EncabezadoApp />
                <div className="flex flex-1 flex-col">
                    {/* El ancho se limita como en Dashboard y RoomPage (`max-w-6xl`): el
                        home era la única página que se estiraba a pantalla completa.
                        El `@container/main` vive en este mismo div y no en uno exterior,
                        porque si no las container queries medirían el ancho sin limitar. */}
                    <div className="@container/main mx-auto flex h-full w-full max-w-6xl flex-col gap-8 px-4 py-6 md:px-6 md:py-8 lg:px-8">
                        <HeroEnfoque
                            saludo={obtenerSaludo()}
                            nombre={primerNombre}
                            minutosHoy={statsByRange.day.displayMinutes}
                            metaMinutos={META_DIARIA_MINUTOS}
                            racha={stats.currentStreak}
                            tareasHoy={statsByRange.day.displayCompletedTasks}
                            cargando={cargandoStats}
                        />

                        <SalaNueva />

                        <div className="flex flex-col gap-4">
                            <h2 className="text-xl font-bold tracking-tight">Tus tareas</h2>

                            {tareas.length === 0 ? (
                                // Sin tareas no hay nada que filtrar ni que ordenar: la tabla
                                // vacía deja de aportar y estorba.
                                <TareasVacias
                                    slotAltaRapida={<QuickAddTarea onCrear={manejarAltaRapida} />}
                                />
                            ) : (
                                <>
                                    <FiltroCategorias
                                        categorias={categorias}
                                        activa={categoriaActiva}
                                        total={tareas.length}
                                        onSeleccionar={establecerCategoriaActiva}
                                    />
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={categoriaActiva}
                                            initial={sinMovimiento ? false : { opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={sinMovimiento ? { opacity: 1 } : { opacity: 0, y: -6 }}
                                            transition={{ duration: sinMovimiento ? 0 : 0.18, ease: "easeOut" }}
                                        >
                                            <DataTable
                                                data={tareasFiltradas}
                                                onTasksChange={manejarCambioTareas}
                                                onActualizarTarea={manejarActualizarTarea}
                                                slotAltaRapida={<QuickAddTarea onCrear={manejarAltaRapida} />}
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default Home
