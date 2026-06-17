import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import * as salasService from "@/features/room/services/salasService";
import { TimerDisplay } from "@/features/timer/components/TimerDisplay";
import { useTareas } from "@/features/tasks/hooks/useTareas";
import { usePresenciaSala } from "@/features/room/hooks/usePresenciaSala";
import { useSincronizacionReloj } from "@/features/timer/hooks/useSincronizacionReloj";
import { DataTable } from "@/components/data-table";
import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/features/auth/context/AuthContext";

// Los nombres de campos van en inglés porque así están definidos en Supabase
type Invitacion = {
    code: string;
    expires_at: string | null;
    max_uses: number | null;
    uses: number;
    created_at: string;
};

// Una invitación es válida si no expiró y todavía le quedan usos disponibles
function InvitacionValida(inv: Invitacion) {
    const noExpirada = !inv.expires_at || new Date(inv.expires_at).getTime() > Date.now();
    const tieneUsos = inv.max_uses == null || inv.uses < inv.max_uses;
    return noExpirada && tieneUsos;
}


/**
 * Página de una sala de estudio compartida. Coordina:
 *  - la presencia en tiempo real de los usuarios conectados,
 *  - el reloj compartido sincronizado vía la columna `timer_state`,
 *  - y las tareas (personales y de la sala) con suscripción en tiempo real.
 */
const RoomPage = () => {
    // `roomId` proviene del parámetro de la ruta (contrato con el router)
    const { roomId } = useParams();
    const [invitacion, establecerInvitacion] = useState<Invitacion | null>();
    const [cargandoInvitacion, establecerCargandoInvitacion] = useState<boolean>(false);
    const [error, establecerError] = useState<string | null>(null);
    const navigate = useNavigate();
    const auth = useAuth();
    const usuario = auth.user;

    // Hooks de dominio: presencia, tareas y sincronización del reloj compartido.
    // La página ya no maneja canales de Supabase ni el estado de tareas a mano.
    const usuariosEnSala = usePresenciaSala(roomId);
    const { tareas, cargado, guardarCambios, moverTarea } = useTareas(roomId);
    useSincronizacionReloj(roomId);

    // Estado de UI de la sección de tareas (pestaña activa + contador de "no vistas")
    const [pestanaTareas, establecerPestanaTareas] = useState<"personal" | "sala">("personal");
    const [cantidadNoVistas, establecerCantidadNoVistas] = useState(0);
    const conteoSalaPrevio = useRef<number | null>(null);

    // Lleva la cuenta de tareas de sala "no vistas" mientras se está en la pestaña personal
    useEffect(() => {
        if (!cargado) return;

        const conteoSalaActual = tareas.filter(t => t.room_id === roomId).length;

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
    }, [tareas, pestanaTareas, roomId, cargado]);

    // Carga la invitación vigente de la sala (lo demás lo resuelven los hooks)
    useEffect(() => {
        if (!roomId || !usuario) return;

        const cargarInvitacion = async () => {
            establecerCargandoInvitacion(true);
            try {
                const invitacionData = await salasService.obtenerInvitacion(roomId);
                establecerCargandoInvitacion(false);
                establecerInvitacion(invitacionData && InvitacionValida(invitacionData) ? invitacionData : null);
            } catch (error: any) {
                establecerCargandoInvitacion(false);
                console.error("Error al inicializar la sala:", error);
                establecerError(error?.message ?? "No se pudo cargar la sala.");
                establecerInvitacion(null);
            }
        };

        cargarInvitacion();
    }, [roomId, usuario]);

    // Sincroniza hacia Supabase los cambios hechos sobre la tabla de tareas (drag & drop, edición)
    const manejarCambioTareas = useCallback(async (nuevoEstadoTareas: any[]) => {
        try {
            await guardarCambios(nuevoEstadoTareas, pestanaTareas);
        } catch (error) {
            console.error("Error al sincronizar las tareas en Supabase:", error);
        }
    }, [guardarCambios, pestanaTareas]);

    // Mueve una tarea entre el ámbito personal y el de la sala (alterna su room_id)
    const manejarMoverTarea = useCallback(async (tareaId: number) => {
        try {
            await moverTarea(tareaId);
        } catch (error) {
            console.error("Error al mover la tarea:", error);
        }
    }, [moverTarea]);

    // Arma el enlace de invitación a partir del código vigente
    const enlaceInvitacion = useMemo(() => {
        if (!invitacion?.code) return null;
        return `${window.location.origin}/invitacion/${invitacion.code}`;
    }, [invitacion?.code]);

    // Tareas a mostrar según la pestaña activa (personales o de la sala)
    const tareasMostradas = useMemo(() => {
        if (pestanaTareas === "personal") {
            return tareas.filter(t => t.room_id === null);
        } else {
            return tareas.filter(t => t.room_id === roomId);
        }
    }, [tareas, pestanaTareas, roomId]);


    return (
        <div className="w-full min-h-dvh py-6 lg:py-24 px-4 bg-background selection:bg-primary/20 overflow-x-hidden">
            <div className="max-w-6xl mx-auto space-y-12 lg:space-y-24 relative mt-16 lg:mt-0">

                {/* Cabecera Responsiva (Salir y Usuarios) */}
                <div className="flex items-center justify-between lg:absolute lg:-top-16 lg:left-0 lg:right-0 mb-8 lg:mb-0 w-full animate-in fade-in duration-700">
                    <div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Salir
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="sm:max-w-[425px]">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>¿Salir de la sala?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Volverás al inicio.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Mantenerse</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => navigate("/")}>
                                        Salir de la sala
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>

                    {/* Indicador de usuarios en sala */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="text-sm text-muted-foreground hidden sm:flex flex-col items-end">
                            <span className="font-medium text-foreground">En sala</span>
                            <span className="text-xs">{usuariosEnSala.length} {usuariosEnSala.length === 1 ? 'persona' : 'personas'}</span>
                        </div>
                        <AvatarGroup>
                            <TooltipProvider delayDuration={100}>
                                {usuariosEnSala.map((user) => (
                                    <Tooltip key={user.id}>
                                        <TooltipTrigger asChild>
                                            <div className="relative cursor-help">
                                                <Avatar size="sm" className="ring-2 ring-background hover:ring-primary/50 transition-all">
                                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                    <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="z-50 text-xs font-medium">
                                            <p>{user.name}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </TooltipProvider>
                        </AvatarGroup>
                    </div>
                </div>

                {cargandoInvitacion ? (
                    <Empty className="w-full h-full flex flex-col items-center justify-center">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Spinner />
                            </EmptyMedia>
                            <EmptyTitle>Procesando tu invitación...</EmptyTitle>
                            <EmptyDescription>
                                Por favor espera mientras procesamos tu invitación. No recargues la página.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                                Cancelar
                            </Button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <>
                        <div className="flex items-center justify-center border border-dashed rounded-3xl bg-card/10 w-full min-h-80 lg:h-96 py-8 lg:py-0">
                            <TimerDisplay enlace={enlaceInvitacion || ""} codigo={invitacion?.code || ""} salaId={roomId} />
                        </div>

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
                                        onClick={() => establecerPestanaTareas("personal")}
                                    >
                                        Mis Tareas
                                    </button>
                                    <button
                                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${pestanaTareas === 'sala' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => establecerPestanaTareas("sala")}
                                    >
                                        Tareas de la Sala
                                        {cantidadNoVistas > 0 && (
                                            <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white shadow-sm transition-all dark:bg-violet-600">
                                                {cantidadNoVistas}
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <DataTable
                                    data={tareasMostradas}
                                    onTasksChange={manejarCambioTareas}
                                    onMoveTask={manejarMoverTarea}
                                    key={pestanaTareas} // Forza un re-render del DataTable al cambiar de pestaña
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default RoomPage;
