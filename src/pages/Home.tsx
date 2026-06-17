import { AppSidebar } from "@/components/app-sidebar"
import { DataTable } from "@/components/data-table"
import { SiteHeader } from "@/components/site-header"
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar"

import { Separator } from "@/components/ui/separator"
import SalaNueva from "../features/home/components/SalaNueva"
import { useEffect, useState } from "react"
import supabase from "@/lib/supabase"
import * as tareasService from "@/features/tasks/services/tareasService"
import { useAuth } from "@/features/auth/context/AuthContext"


/**
 * Página de inicio: muestra el panel para crear/unirse a salas y la lista de
 * tareas personales del usuario, sincronizada en tiempo real con Supabase.
 */
const Home = () => {
    const auth = useAuth();
    const usuario = auth.user;
    const [tareas, establecerTareas] = useState<any[]>([]);

    useEffect(() => {
        if (!usuario) return;

        // Trae las tareas personales (sin sala asociada) del usuario actual
        const cargarTareas = async () => {
            try {
                const data = await tareasService.obtenerTareasPersonales(usuario.id);
                establecerTareas(data);
            } catch (error) {
                console.error("Error al cargar las tareas:", error);
            }
        };

        cargarTareas();

        // Suscripción en tiempo real a las Tareas Personales
        const canalTareas = supabase
            .channel("realtime-home-tasks")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tasks",
                    filter: `user_id=eq.${usuario.id}`,
                },
                () => { cargarTareas(); }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(canalTareas);
        };
    }, [usuario]);

    // Persiste en Supabase los cambios hechos en la tabla de tareas (edición, alta, baja)
    const manejarCambioTareas = async (nuevoEstadoTareas: any[]) => {
        const nuevosIds = new Set(nuevoEstadoTareas.map(t => t.id));

        // Tareas eliminadas: las que estaban en el estado local y ya no figuran
        const tareasEliminadas = tareas.filter(t => !nuevosIds.has(t.id));

        try {
            await tareasService.eliminarTareas(tareasEliminadas.map(t => t.id));

            // Tareas añadidas o actualizadas
            for (const t of nuevoEstadoTareas) {
                // Las claves se mantienen en inglés porque son columnas de la tabla `tasks`
                const datosTarea: any = {
                    user_id: usuario?.id,
                    room_id: null,
                    header: t.header,
                    type: t.type,
                    status: t.status,
                    priority: t.priority,
                    favorite: t.favorite,
                    order_index: t.order_index,
                };

                if (t.id && t.id < 1000000) {
                    // Actualizar una tarea existente
                    await tareasService.actualizarTarea(t.id, datosTarea);
                } else {
                    // Insertar una tarea nueva
                    await tareasService.insertarTareas([datosTarea]);
                }
            }
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
