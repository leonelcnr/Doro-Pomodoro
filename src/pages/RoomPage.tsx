import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import supabase from "@/lib/supabase";
import * as tareasService from "@/features/tasks/services/tareasService";
import * as salasService from "@/features/room/services/salasService";
import { TimerDisplay } from "@/features/timer/components/TimerDisplay";
import { useTimerStore } from "@/store/timerStore";
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
    // Acción del store para aplicar el estado del reloj recibido desde la sala
    const establecerEstadoTemporizador = useTimerStore((estado) => estado.establecerEstadoTemporizador);

    // Usuarios actualmente conectados a la sala (presencia en tiempo real)
    const [usuariosEnSala, establecerUsuariosEnSala] = useState<any[]>([]);

    // Tareas
    const [tareas, establecerTareas] = useState<any[]>([]);
    const [pestanaTareas, establecerPestanaTareas] = useState<"personal" | "sala">("personal");
    const [cantidadNoVistas, establecerCantidadNoVistas] = useState(0);
    const conteoSalaPrevio = useRef<number | null>(null);
    const tareasCargadas = useRef(false);

    // Lleva la cuenta de tareas de sala "no vistas" mientras se está en la pestaña personal
    useEffect(() => {
        if (!tareasCargadas.current) return;

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
    }, [tareas, pestanaTareas, roomId]);

    // Presencia en tiempo real: registra y escucha quién está conectado a la sala
    useEffect(() => {
        if (!roomId || !usuario) return;

        // Limpiamos el estado anterior al cambiar de sala (por seguridad)
        establecerUsuariosEnSala([]);

        const canal = supabase.channel(`room-${roomId}`, {
            config: {
                presence: {
                    key: usuario.id,
                },
            },
        });

        canal
            .on("presence", { event: "sync" }, () => {
                const estado = canal.presenceState();
                // Extraemos los usuarios únicos
                const usuarios = Object.values(estado).map((infoPresencia: any) => infoPresencia[0]);
                establecerUsuariosEnSala(usuarios);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await canal.track({
                        id: usuario.id,
                        name: usuario.email?.split("@")[0] || "Usuario",
                        avatarUrl: usuario.avatar_url,
                    });
                }
            });

        return () => {
            supabase.removeChannel(canal);
        };
    }, [roomId, usuario]);

    // Carga inicial de datos de la sala y suscripciones en tiempo real (tareas y reloj)
    useEffect(() => {
        if (!roomId || !usuario) return;

        const inicializarDatosSala = async () => {
            establecerCargandoInvitacion(true);
            try {
                // [async-parallel] Lanzamos las peticiones independientes en paralelo (vía servicios)
                const [invitacionData, tareasData, estadoReloj] = await Promise.all([
                    salasService.obtenerInvitacion(roomId),
                    tareasService.obtenerTareasDeSala(roomId, usuario.id),
                    salasService.obtenerEstadoReloj(roomId),
                ]);

                // React 18 agrupa estos setStates (batched updates) evitando re-renders múltiples
                establecerCargandoInvitacion(false);
                establecerInvitacion(invitacionData && InvitacionValida(invitacionData) ? invitacionData : null);
                tareasCargadas.current = true;
                establecerTareas(tareasData);
                if (estadoReloj) establecerEstadoTemporizador(estadoReloj);
            } catch (error: any) {
                establecerCargandoInvitacion(false);
                console.error("Error al inicializar la sala:", error);
                establecerError(error?.message ?? "No se pudo cargar la sala.");
                establecerInvitacion(null);
            }
        };

        const recargarTareas = async () => {
            try {
                const data = await tareasService.obtenerTareasDeSala(roomId, usuario.id);
                establecerTareas(data);
            } catch (error) {
                console.error("Error al recargar las tareas:", error);
            }
        };

        inicializarDatosSala();

        // Suscripción a las Tareas de la Sala
        const canalTareas = supabase
            .channel(`realtime-tasks-${roomId}`)
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tasks", filter: `room_id=eq.${roomId}` },
                recargarTareas
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${usuario.id}` },
                recargarTareas
            )
            .subscribe();

        // Suscripción a los cambios de la Sala (para el Reloj Compartido)
        const canalSala = supabase
            .channel(`realtime-room-${roomId}`)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
                (payload) => {
                    if (payload.new && payload.new.timer_state) {
                        establecerEstadoTemporizador(payload.new.timer_state);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(canalTareas);
            supabase.removeChannel(canalSala);
        };
    }, [roomId, usuario]);

    // Sincroniza hacia Supabase los cambios hechos sobre la tabla de tareas (drag & drop, edición)
    const manejarCambioTareas = useCallback(async (nuevoEstadoTareas: any[]) => {
        const nuevosIds = new Set(nuevoEstadoTareas.map(t => t.id));

        const tareasPestanaActual = pestanaTareas === "personal"
            ? tareas.filter(t => t.room_id === null)
            : tareas.filter(t => t.room_id === roomId);

        const idsEliminados = tareasPestanaActual.filter(t => !nuevosIds.has(t.id)).map(t => t.id);

        const tareasExistentesActualizar: any[] = [];
        const tareasNuevasInsertar: any[] = [];

        nuevoEstadoTareas.forEach((t) => {
            const esPersonal = pestanaTareas === "personal";
            // Las claves se mantienen en inglés porque son columnas de la tabla `tasks`
            const datosNuevaTarea = {
                user_id: usuario?.id,
                room_id: (t.room_id) ? t.room_id : (esPersonal ? null : roomId),
                header: t.header,
                type: t.type,
                status: t.status,
                priority: t.priority,
                favorite: t.favorite,
                order_index: t.order_index,
            };

            if (t.id && t.id < 1000000) {
                tareasExistentesActualizar.push({ id: t.id, ...datosNuevaTarea });
            } else {
                tareasNuevasInsertar.push(datosNuevaTarea);
            }
        });

        try {
            await tareasService.eliminarTareas(idsEliminados);
            await tareasService.upsertTareas(tareasExistentesActualizar);
            await tareasService.insertarTareas(tareasNuevasInsertar);
        } catch (error) {
            console.error("Error al sincronizar las tareas en Supabase:", error);
        }
    }, [pestanaTareas, tareas, roomId, usuario?.id]);

    // Mueve una tarea entre el ámbito personal y el de la sala (alterna su room_id)
    const manejarMoverTarea = useCallback(async (tareaId: number) => {
        const tarea = tareas.find(t => t.id === tareaId);
        if (!tarea) return;

        const nuevaSalaId = tarea.room_id ? null : (roomId ?? null);
        try {
            await tareasService.moverTarea(tareaId, nuevaSalaId);
        } catch (error) {
            console.error("Error al mover la tarea:", error);
        }
    }, [tareas, roomId]);

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
