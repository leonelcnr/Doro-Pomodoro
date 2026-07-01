import { Flame, CheckCircle2 } from "lucide-react";
import { formatearMinutosCompacto } from "@/features/home/saludo";

interface HeroEnfoqueProps {
    saludo: string;
    /** Primer nombre del usuario; vacío para sesiones anónimas. */
    nombre: string;
    minutosHoy: number;
    metaMinutos: number;
    racha: number;
    tareasHoy: number;
}

/**
 * Hero de la página de inicio (dirección "Ritual de enfoque"). Componente
 * presentacional: recibe los datos ya calculados por props y no sabe de
 * Supabase. La firma visual es el "anillo de enfoque", un arco circular que
 * evoca el temporizador Pomodoro y se llena según el progreso hacia la meta
 * diaria de minutos.
 */
export function HeroEnfoque({ saludo, nombre, minutosHoy, metaMinutos, racha, tareasHoy }: HeroEnfoqueProps) {
    const radio = 46;
    const circunferencia = 2 * Math.PI * radio;
    const progreso = Math.min(minutosHoy / Math.max(metaMinutos, 1), 1);
    const desplazamiento = circunferencia * (1 - progreso);

    return (
        <section className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            {/* Anillo de enfoque: muestra los minutos de hoy y su avance hacia la meta */}
            <div
                className="relative size-28 shrink-0"
                role="img"
                aria-label={`${minutosHoy} minutos de enfoque hoy de una meta de ${metaMinutos}`}
            >
                <svg className="size-full -rotate-90" viewBox="0 0 112 112">
                    <circle
                        cx="56" cy="56" r={radio}
                        fill="none" strokeWidth="9"
                        className="stroke-muted"
                    />
                    <circle
                        cx="56" cy="56" r={radio}
                        fill="none" strokeWidth="9" strokeLinecap="round"
                        strokeDasharray={circunferencia}
                        strokeDashoffset={desplazamiento}
                        className="stroke-violet-500 transition-[stroke-dashoffset] duration-700 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="text-xl font-bold tracking-tight">{formatearMinutosCompacto(minutosHoy)}</span>
                    <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        de {formatearMinutosCompacto(metaMinutos)}
                    </span>
                </div>
            </div>

            {/* Saludo + franja de stats del día */}
            <div className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        {saludo}
                        {nombre && (
                            <>
                                ,{" "}
                                <span className="bg-gradient-to-r from-violet-400 to-violet-600 bg-clip-text text-transparent">
                                    {nombre}
                                </span>
                            </>
                        )}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                        Sumá enfoque a tu día: creá una sala o seguí con tus tareas.
                    </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground">
                        <Flame className="size-4 text-orange-500" />
                        <b className="font-semibold text-foreground">{racha}</b>
                        {racha === 1 ? "día" : "días"} de racha
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        <b className="font-semibold text-foreground">{tareasHoy}</b>
                        {tareasHoy === 1 ? "tarea" : "tareas"} hoy
                    </span>
                </div>
            </div>
        </section>
    );
}

export default HeroEnfoque;
