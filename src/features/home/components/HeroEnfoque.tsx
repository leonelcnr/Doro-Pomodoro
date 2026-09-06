import { Skeleton } from "@/components/ui/skeleton";
import { formatearMinutosCompacto } from "@/features/home/saludo";

interface HeroEnfoqueProps {
    saludo: string;
    /** Primer nombre del usuario; vacío para sesiones anónimas. */
    nombre: string;
    minutosHoy: number;
    metaMinutos: number;
    racha: number;
    tareasHoy: number;
    /** Mientras las estadísticas viajan, se muestra el esqueleto en vez de ceros. */
    cargando?: boolean;
}

/**
 * Hero de la página de inicio (dirección "Ritual de enfoque"). Componente
 * presentacional: recibe los datos ya calculados por props y no sabe de
 * Supabase. La firma visual es el "anillo de enfoque", un arco circular que
 * evoca el temporizador Pomodoro y se llena según el progreso hacia la meta
 * diaria de minutos.
 *
 * El anillo es lo único con color: racha y tareas viven en una línea de texto.
 * Antes eran dos píldoras con ícono naranja y esmeralda que competían con el
 * anillo y sumaban acentos sobre una paleta que es neutra a propósito.
 *
 * El reflujo usa container queries (`@xl/main:`) y no breakpoints de viewport:
 * este componente vive dentro del `@container/main` que declara `Home.tsx`, y
 * con `sm:` no se enteraba de que la sidebar le comía 288px de ancho.
 */
export function HeroEnfoque({ saludo, nombre, minutosHoy, metaMinutos, racha, tareasHoy, cargando = false }: HeroEnfoqueProps) {
    const radio = 46;
    const circunferencia = 2 * Math.PI * radio;
    const progreso = Math.min(minutosHoy / Math.max(metaMinutos, 1), 1);
    const desplazamiento = circunferencia * (1 - progreso);

    // Con las stats en vuelo, los valores reales son 0. Pintarlos diría que el
    // usuario perdió la racha hasta que llega la respuesta, así que se reserva el
    // espacio con un esqueleto de la misma forma que el layout final.
    if (cargando) return <HeroEnfoqueEsqueleto saludo={saludo} nombre={nombre} />;

    return (
        <section className="flex flex-col items-center gap-6 @xl/main:flex-row @xl/main:items-center">
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
                        className="stroke-brand transition-[stroke-dashoffset] duration-700 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                    <span className="text-xl font-bold tracking-tight">{formatearMinutosCompacto(minutosHoy)}</span>
                    <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        de {formatearMinutosCompacto(metaMinutos)}
                    </span>
                </div>
            </div>

            {/* Saludo + resumen del día en texto plano */}
            <div className="flex flex-col items-center gap-2 text-center @xl/main:items-start @xl/main:text-left">
                <h1 className="text-2xl font-bold tracking-tight @xl/main:text-3xl">
                    {saludo}
                    {nombre && `, ${nombre}`}
                </h1>
                <p className="text-sm text-muted-foreground tabular-nums">
                    <b className="font-semibold text-foreground">{racha}</b>{" "}
                    {racha === 1 ? "día seguido" : "días seguidos"}
                    {" · "}
                    <b className="font-semibold text-foreground">{tareasHoy}</b>{" "}
                    {tareasHoy === 1 ? "tarea completada" : "tareas completadas"}
                </p>
            </div>
        </section>
    );
}

/**
 * Esqueleto del hero mientras cargan las estadísticas. Copia las medidas del
 * layout real (anillo de 112px, título, línea de resumen) para que no haya salto
 * cuando llegan los datos. El saludo sí se muestra: no depende de la red.
 */
function HeroEnfoqueEsqueleto({ saludo, nombre }: { saludo: string; nombre: string }) {
    return (
        <section
            className="flex flex-col items-center gap-6 @xl/main:flex-row @xl/main:items-center"
            aria-busy="true"
            aria-label="Cargando tu resumen de enfoque"
        >
            <Skeleton className="size-28 shrink-0 rounded-full" />
            <div className="flex flex-col items-center gap-2 @xl/main:items-start">
                <h1 className="text-2xl font-bold tracking-tight @xl/main:text-3xl">
                    {saludo}
                    {nombre && `, ${nombre}`}
                </h1>
                <Skeleton className="h-5 w-64 max-w-full" />
            </div>
        </section>
    );
}

export default HeroEnfoque;
