import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import supabase from "@/lib/supabase";
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

type Invitacion = { // va en ingles porque asi quedo definido en el supabase
    code: string;
    expires_at: string | null;
    max_uses: number | null;
    uses: number;
    created_at: string;
};

function InvitacionValida(inv: Invitacion) {
    const noExpirada = !inv.expires_at || new Date(inv.expires_at).getTime() > Date.now();
    const tieneUsos = inv.max_uses == null || inv.uses < inv.max_uses;
    return noExpirada && tieneUsos;
}


const RoomPage = () => {
    const { roomId } = useParams();
    const [invitacion, setInvitacion] = useState<Invitacion | null>();
    const [cargandoInvitacion, setCargandoInvitacion] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const auth = useAuth();
    const usuario = auth.user;
    const setTimerState = useTimerStore((state) => state.setTimerState);

    // Para manejar los usuarios conectados a la sala
    const [usuariosEnSala, setUsuariosEnSala] = useState<any[]>([]);

    // Tareas
    const [tareas, setTareas] = useState<any[]>([]);
    const [taskTab, setTaskTab] = useState<"personal" | "room">("personal");
    const [unseenCount, setUnseenCount] = useState(0);
    const prevRoomCount = useRef<number | null>(null);
    const tasksLoaded = useRef(false);

    useEffect(() => {
        if (!tasksLoaded.current) return;

        const currentRoomCount = tareas.filter(t => t.room_id === roomId).length;

        if (prevRoomCount.current === null) {
            prevRoomCount.current = currentRoomCount;
            return;
        }

        if (taskTab === "room") {
            setUnseenCount(0);
            prevRoomCount.current = currentRoomCount;
        } else if (currentRoomCount !== prevRoomCount.current) {
            // Count increased (other user added a task or dragged a task over)
            if (currentRoomCount > prevRoomCount.current) {
                const newTasksCount = currentRoomCount - prevRoomCount.current;
                setUnseenCount(prev => prev + newTasksCount);
            }
            prevRoomCount.current = currentRoomCount;
        }
    }, [tareas, taskTab, roomId]);

    useEffect(() => {
        if (!roomId || !usuario) return;

        // Limpiar el estado anterior si se cambia de sala (por seguridad)
        setUsuariosEnSala([]);

        const channel = supabase.channel(`room-${roomId}`, {
            config: {
                presence: {
                    key: usuario.id,
                },
            },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                // Extraer los usuarios únicos
                const users = Object.values(state).map((presenceInfo: any) => presenceInfo[0]);
                setUsuariosEnSala(users);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await channel.track({
                        id: usuario.id,
                        name: usuario.email?.split("@")[0] || "Usuario",
                        avatarUrl: usuario.avatar_url,
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [roomId, usuario]);

    useEffect(() => {
        if (!roomId || !usuario) return;

        const initRoomData = async () => {
            setCargandoInvitacion(true);

            // Asegurar membresía antes de leer la sala: las policies RLS por
            // membresía exigen una fila en room_members para ver tareas/timer y
            // sincronizar timer/música. Variante permisiva: cualquiera con el
            // link de la sala (/room/:id) se une. Es idempotente y persistente.
            const { error: joinError } = await supabase.rpc("join_room_by_id", { p_room_id: roomId });
            if (joinError) {
                console.error("Error al unirse a la sala:", joinError);
                setCargandoInvitacion(false);
                setError(joinError.message || "No se pudo acceder a la sala.");
                return;
            }

            // [async-parallel] Ejecutar requests de red independientes en paralelo
            const [inviteRes, tasksRes, clockRes] = await Promise.all([
                supabase
                    .from("room_invites")
                    .select("code, expires_at, max_uses, uses, created_at")
                    .eq("room_id", roomId)
                    .order("created_at", { ascending: false })
                    .limit(1),
                supabase
                    .from("tasks")
                    .select("*")
                    .or(`room_id.eq.${roomId},and(room_id.is.null,user_id.eq.${usuario.id})`)
                    .order("order_index", { ascending: true, nullsFirst: false })
                    .order("created_at", { ascending: false }),
                supabase
                    .from("rooms")
                    .select("timer_state")
                    .eq("id", roomId)
                    .single()
            ]);

            // React 18 agrupará estos setStates (Batched updates) previniendo multiples re-renders
            setCargandoInvitacion(false);

            if (inviteRes.error) {
                // El código de invitación es secundario (solo para compartir):
                // un fallo acá no debe bloquear la sala.
                console.error("Supabase error room_invites:", inviteRes.error);
                setInvitacion(null);
            } else {
                const inv = inviteRes.data?.[0] ?? null;
                setInvitacion(inv && InvitacionValida(inv) ? inv : null);
            }

            if (!tasksRes.error && tasksRes.data) {
                tasksLoaded.current = true;
                setTareas(tasksRes.data);
            }

            if (clockRes.data?.timer_state) {
                setTimerState(clockRes.data.timer_state);
            }
        };

        const recargarTareas = async () => {
             const { data, error } = await supabase
                .from("tasks")
                .select("*")
                .or(`room_id.eq.${roomId},and(room_id.is.null,user_id.eq.${usuario.id})`)
                .order("order_index", { ascending: true, nullsFirst: false })
                .order("created_at", { ascending: false });
             if (!error && data) setTareas(data);
        };

        initRoomData();

        // Suscribirse a Tareas de la Sala
        const channelTasks = supabase
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

        // Suscribirse a Cambios de la Sala (para el Reloj Compartido)
        const channelRoom = supabase
            .channel(`realtime-room-${roomId}`)
            .on(
                "postgres_changes",
                { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
                (payload) => {
                    if (payload.new && payload.new.timer_state) {
                        setTimerState(payload.new.timer_state);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channelTasks);
            supabase.removeChannel(channelRoom);
        };
    }, [roomId, usuario]);

    const handleTasksChange = useCallback(async (newTasksState: any[]) => {
        const newIds = new Set(newTasksState.map(t => t.id));

        const currentTabTasks = taskTab === "personal"
            ? tareas.filter(t => t.room_id === null)
            : tareas.filter(t => t.room_id === roomId);

        const deletedIds = currentTabTasks.filter(t => !newIds.has(t.id)).map(t => t.id);
        if (deletedIds.length > 0) {
            await supabase.from("tasks").delete().in("id", deletedIds);
        }

        const existingTasksToUpdate: any[] = [];
        const newTasksToInsert: any[] = [];

        newTasksState.forEach((t) => {
            const esPersonal = taskTab === "personal";
            const newTaskData = {
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
                existingTasksToUpdate.push({ id: t.id, ...newTaskData });
            } else {
                newTasksToInsert.push(newTaskData);
            }
        });

        if (existingTasksToUpdate.length > 0) {
            const { error } = await supabase.from("tasks").upsert(existingTasksToUpdate);
            if (error) console.error("Supabase upsert error:", error);
        }

        if (newTasksToInsert.length > 0) {
            const { error } = await supabase.from("tasks").insert(newTasksToInsert);
            if (error) console.error("Supabase insert error:", error);
        }
    }, [taskTab, tareas, roomId, usuario?.id]);

    const handleMoveTask = useCallback(async (taskId: number) => {
        const task = tareas.find(t => t.id === taskId);
        if (!task) return;

        const newRoomId = task.room_id ? null : roomId;
        await supabase.from("tasks").update({ room_id: newRoomId }).eq("id", taskId);
    }, [tareas, roomId]);

    const linkInvitacion = useMemo(() => {
        if (!invitacion?.code) return null;
        return `${window.location.origin}/invitacion/${invitacion.code}`;
    }, [invitacion?.code]);

    const tareasMostradas = useMemo(() => {
        if (taskTab === "personal") {
            return tareas.filter(t => t.room_id === null);
        } else {
            return tareas.filter(t => t.room_id === roomId);
        }
    }, [tareas, taskTab, roomId]);


    if (error) {
        return (
            <Empty className="w-full h-screen flex flex-col items-center justify-center">
                <EmptyHeader>
                    <EmptyTitle>No se pudo acceder a la sala</EmptyTitle>
                    <EmptyDescription>{error}</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                        Volver al inicio
                    </Button>
                </EmptyContent>
            </Empty>
        );
    }

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
                            <TimerDisplay link={linkInvitacion || ""} codigo={invitacion?.code || ""} roomId={roomId} />
                        </div>

                        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 px-0 lg:px-2">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-1 mb-2">
                                    <h1 className="text-2xl font-bold tracking-tight">Tareas</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Aquí tienes una lista de tus tareas de {taskTab === 'personal' ? 'forma personal' : 'sala'}.
                                    </p>
                                </div>
                                <div className="flex border-b border-border/50 mb-4">
                                    <button
                                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${taskTab === 'personal' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setTaskTab("personal")}
                                    >
                                        Mis Tareas
                                    </button>
                                    <button
                                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${taskTab === 'room' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setTaskTab("room")}
                                    >
                                        Tareas de la Sala
                                        {unseenCount > 0 && (
                                            <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-violet-500 text-[10px] font-bold text-white shadow-sm transition-all dark:bg-violet-600">
                                                {unseenCount}
                                            </span>
                                        )}
                                    </button>
                                </div>
                                <DataTable
                                    data={tareasMostradas}
                                    onTasksChange={handleTasksChange}
                                    onMoveTask={handleMoveTask}
                                    key={taskTab} // Forza un re-render del DataTable al cambiar de tab
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
