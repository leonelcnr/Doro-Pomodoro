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

            const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .eq("user_id", usuario.id)
                .is("room_id", null)
                .order("order_index", { ascending: true, nullsFirst: false })
                .order("created_at", { ascending: false });

            if (!error && data) establecerTareas(data);
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
        for (const t of tareasEliminadas) {
            await supabase.from("tasks").delete().eq("id", t.id);
        }

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
                const { error } = await supabase.from("tasks").update(datosTarea).eq("id", t.id);
                if (error) {
                    console.error("Error de update en Supabase:", error);
                    alert(`Error al actualizar la tarea: ${error.message} (Detalles: ${error.details})`);
                }
            } else {
                // Insertar una tarea nueva
                const { error } = await supabase.from("tasks").insert([datosTarea]);
                if (error) {
                    console.error("Error de insert en Supabase:", error);
                    alert(`Error al crear la tarea: ${error.message} (Detalles: ${error.details})`);
                }
            }
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
