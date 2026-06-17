import { useEffect, useState } from "react"
import { Flame, Clock, CheckCircle2, TrendingUp } from "lucide-react"
import supabase from "@/lib/supabase"
import { useAuth } from "@/features/auth/context/AuthContext"
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

/**
 * Botón de la barra lateral que muestra la racha diaria de estudio. Al abrirlo,
 * despliega un popover con métricas (racha actual, minutos totales de enfoque y
 * tareas completadas), todo leído desde Supabase y actualizado en tiempo real.
 */
export function DailyStreak() {
    const { user } = useAuth();
    const [racha, establecerRacha] = useState(0);
    const [estadisticas, establecerEstadisticas] = useState({ minutosTotales: 0, tareasCompletadas: 0 });
    const [estudioHoy, establecerEstudioHoy] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Carga inicial de la racha, los minutos totales, las tareas completadas y si estudió hoy
        const cargarDatos = async () => {

            const { data, error } = await supabase
                .from("user_stats")
                .select("current_streak, total_study_minutes")
                .eq("user_id", user.id)
                .single();

            if (!error && data) {
                establecerRacha(data.current_streak || 0);
                establecerEstadisticas(previa => ({ ...previa, minutosTotales: data.total_study_minutes || 0 }));
            }

            const { count: cantidadTareas } = await supabase
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'Completada');
            establecerEstadisticas(previa => ({ ...previa, tareasCompletadas: cantidadTareas || 0 }));

            const inicioDeHoy = new Date();
            inicioDeHoy.setHours(0, 0, 0, 0);
            const { data: sesionesDeHoy } = await supabase
                .from('study_sessions')
                .select('id')
                .eq('user_id', user.id)
                .gte('created_at', inicioDeHoy.toISOString())
                .limit(1);
            establecerEstudioHoy(sesionesDeHoy && sesionesDeHoy.length > 0 ? true : false);
        };

        cargarDatos();

        // Suscripción en tiempo real: refresca la racha/minutos y marca si estudió hoy
        const canal = supabase
            .channel('realtime-streaks-popover')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'user_stats', filter: `user_id=eq.${user.id}` },
                (payload) => {
                    establecerRacha(payload.new.current_streak);
                    establecerEstadisticas(previa => ({ ...previa, minutosTotales: payload.new.total_study_minutes || 0 }));
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'study_sessions', filter: `user_id=eq.${user.id}` },
                () => establecerEstudioHoy(true)
            )
            .subscribe();

        return () => {
            supabase.removeChannel(canal);
        };
    }, [user]);

    // Si no hay racha todavía, no mostramos nada
    if (racha === 0) return null;

    // Formatea minutos a "Xm" o "Yh Zm"
    const formatearMinutos = (m: number) => {
        if (m < 60) return `${m}m`;
        return `${Math.floor(m / 60)}h ${m % 60}m`;
    };

    // Cuando todavía no estudió hoy, mostramos la llama en gris (apagada)
    const esGris = !estudioHoy;
    const coloresBoton = esGris
        ? "bg-muted hover:bg-muted/80 text-muted-foreground border-border data-[state=open]:bg-muted/80"
        : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border-orange-500/20 data-[state=open]:bg-orange-500/20";
    const colorFuego = esGris ? "text-muted-foreground fill-current opacity-80" : "fill-current animate-pulse text-orange-500 duration-3000";

    return (
        <SidebarMenu className="mt-4">
            <SidebarMenuItem>
                <Popover>
                    <PopoverTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className={`border ${coloresBoton}`}
                        >
                            <div className="flex aspect-square size-8 items-center justify-center">
                                <Flame className={`size-5 ${colorFuego}`} />
                            </div>
                            <div className="flex flex-col gap-0.5 leading-none">
                                <span className="font-bold">{racha} Días</span>
                                <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">De Racha</span>
                            </div>
                        </SidebarMenuButton>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" className="w-64 p-4 mt-2 ml-2 bg-popover/95 backdrop-blur-md border-border shadow-xl rounded-xl">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-2 border-b border-border pb-3">
                                <div className={`flex items-center justify-center size-8 rounded-full ${esGris ? 'bg-muted' : 'bg-orange-500/10'}`}>
                                    <Flame className={`size-4 ${esGris ? 'text-muted-foreground' : 'text-orange-500'}`} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground">Desempeño</span>
                                    <span className="text-xs text-muted-foreground">Tu progreso continuo</span>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <TrendingUp className="size-4 text-orange-500" />
                                        <span className="text-sm">Racha Actual</span>
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{racha} {racha === 1 ? 'Día' : 'Días'}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Clock className="size-4 text-violet-500" />
                                        <span className="text-sm">Enfoque Total</span>
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{formatearMinutos(estadisticas.minutosTotales)}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CheckCircle2 className="size-4 text-emerald-500" />
                                        <span className="text-sm">Tareas Terminadas</span>
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{estadisticas.tareasCompletadas}</span>
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
