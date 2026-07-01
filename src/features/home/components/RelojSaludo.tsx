import { Sun, Moon } from "lucide-react";
import { obtenerSaludo, formatearHora } from "@/features/home/saludo";
import { useHoraActual } from "@/features/home/hooks/useHoraActual";

/**
 * Franja contextual del header de inicio: ícono según el momento del día +
 * saludo + hora viva ("☀ Buenas tardes · 14:32"). Componente presentacional;
 * solo depende del hook de hora. En móvil oculta el texto del saludo para
 * dejar el ícono y la hora.
 */
export function RelojSaludo() {
    const ahora = useHoraActual();
    const esDia = ahora.getHours() >= 6 && ahora.getHours() < 20;
    const Icono = esDia ? Sun : Moon;

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icono
                className={esDia ? "size-4 text-amber-500" : "size-4 text-indigo-400"}
                aria-hidden
            />
            <span className="hidden sm:inline">{obtenerSaludo(ahora)}</span>
            <span className="hidden text-muted-foreground/50 sm:inline" aria-hidden>·</span>
            <span className="font-medium tabular-nums text-foreground">{formatearHora(ahora)}</span>
        </div>
    );
}

export default RelojSaludo;
