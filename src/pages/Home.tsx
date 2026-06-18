import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import { Separator } from "@/components/ui/separator"
import SalaNueva from "../features/home/components/SalaNueva"
import { useTareas } from "@/features/tasks/hooks/useTareas"
import type { Tarea } from "@/types/dominio"


/**
 * Página de inicio: muestra el panel para crear/unirse a salas y la lista de
 * tareas personales del usuario, sincronizada en tiempo real con Supabase.
 */
const Home = () => {
    // Sin salaId: el hook trae y escucha solo las tareas personales del usuario
    const { tareas, guardarCambios } = useTareas();

    // Persiste en Supabase los cambios hechos en la tabla de tareas (edición, alta, baja)
    const manejarCambioTareas = async (nuevoEstadoTareas: Tarea[]) => {
        try {
            await guardarCambios(nuevoEstadoTareas, "personal");
        } catch (error: any) {
            console.error("Error al guardar las tareas en Supabase:", error);
            alert(`Error al guardar la tarea: ${error?.message ?? 'desconocido'}${error?.details ? ` (Detalles: ${error.details})` : ''}`);
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
                <AppSidebar variant="inset" />
                <SidebarInset>
                    <SiteHeader />
                    <div className="flex flex-1 flex-col">
                        <div className="@container/main flex flex-1 flex-col gap-0 ">
                            <div className="max-w-full h-full flex flex-col gap-4 px-4 py-4 md:px-6 md:py-6 lg:px-8">
                                <div className="w-full">
                                    <SalaNueva />
                                </div>

                                <Separator
                                    orientation="horizontal"
                                    className="my-4 data-[orientation=horizontal]:w-full"
                                />

                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1 mb-2">
                                        <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
                                        <p className="text-muted-foreground text-sm">
                                            Aquí tienes una lista de tus tareas.
                                        </p>
                                    </div>
                                    <DataTable data={tareas} onTasksChange={manejarCambioTareas} />
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
