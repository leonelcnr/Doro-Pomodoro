import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import SalaNueva from "../features/home/components/SalaNueva"
import { HeroEnfoque } from "@/features/home/components/HeroEnfoque"
import { RelojSaludo } from "@/features/home/components/RelojSaludo"
import { obtenerSaludo } from "@/features/home/saludo"
import { useTareas } from "@/features/tasks/hooks/useTareas"
import { QuickAddTarea } from "@/features/tasks/components/QuickAddTarea"
import { useAuth } from "@/features/auth/context/useAuth"
import { useDashboardStats } from "@/features/dashboard/hooks/useDashboardStats"
import type { Tarea } from "@/types/dominio"

// Meta diaria de minutos de enfoque que llena el anillo del hero.
const META_DIARIA_MINUTOS = 120;

/**
 * Página de inicio: hero con el resumen de enfoque del día, panel para
 * crear/unirse a salas y la lista de tareas personales del usuario,
 * sincronizada en tiempo real con Supabase.
 */
const Home = () => {
    // Sin salaId: el hook trae y escucha solo las tareas personales del usuario
    const { tareas, guardarCambios, crearTarea, actualizarTareaCampos } = useTareas();

    // Datos vivos del hero: reutiliza el hook del dashboard (racha + hoy), que ya
    // trae todo con react-query e invalidación en tiempo real.
    const { user } = useAuth();
    const { stats, statsByRange } = useDashboardStats(user?.id);
    const primerNombre = !user || user.isAnonymous ? "" : (user.name?.split(" ")[0] ?? "");

    // Alta rápida personal (fila inline). Re-lanza el error para verlo en consola.
    const manejarAltaRapida = async (parcial: Partial<Tarea>) => {
        try {
            await crearTarea(parcial, "personal");
        } catch (error) {
            console.error("Error al crear la tarea:", error);
        }
    };

    // Edición rápida de un atributo (tocar para ciclar / elegir categoría)
    const manejarActualizarTarea = async (id: number, datos: Partial<Tarea>) => {
        try {
            await actualizarTareaCampos(id, datos);
        } catch (error) {
            console.error("Error al actualizar la tarea:", error);
        }
    };

    // Persiste en Supabase los cambios hechos en la tabla de tareas (edición, alta, baja)
    const manejarCambioTareas = async (nuevoEstadoTareas: Tarea[]) => {
        try {
            await guardarCambios(nuevoEstadoTareas, "personal");
        } catch (error: unknown) {
            console.error("Error al guardar las tareas en Supabase:", error);
            // Los errores de Supabase (PostgrestError) traen `message` y `details`
            const err = error as { message?: string; details?: string };
            const mensaje = err?.message ?? 'desconocido';
            const detalles = err?.details ? ` (Detalles: ${err.details})` : '';
            alert(`Error al guardar la tarea: ${mensaje}${detalles}`);
        }
    };

    return (
        <>
            <SidebarProvider defaultOpen={false}
                style={
                    {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                    } as React.CSSProperties
                }
            >
                <AppSidebar />
                <SidebarInset>
                    <SiteHeader>
                        <RelojSaludo />
                    </SiteHeader>
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-0 ">
                            <div className="max-w-full h-full flex flex-col gap-8 px-4 py-6 md:px-6 md:py-8 lg:px-8">
                                <HeroEnfoque
                                    saludo={obtenerSaludo()}
                                    nombre={primerNombre}
                                    minutosHoy={statsByRange.day.displayMinutes}
                                    metaMinutos={META_DIARIA_MINUTOS}
                                    racha={stats.currentStreak}
                                    tareasHoy={statsByRange.day.displayCompletedTasks}
                                />

                                <SalaNueva />

                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-xl font-bold tracking-tight">Tus tareas</h2>
                                        <p className="text-muted-foreground text-sm">
                                            Aquí tienes una lista de tus tareas.
                                        </p>
                                    </div>
                                    <DataTable
                                        data={tareas}
                                        onTasksChange={manejarCambioTareas}
                                        onActualizarTarea={manejarActualizarTarea}
                                        slotAltaRapida={<QuickAddTarea onCrear={manejarAltaRapida} />}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </>
    )
}

export default Home
