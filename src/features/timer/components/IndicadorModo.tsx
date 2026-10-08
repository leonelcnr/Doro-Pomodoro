import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Modo } from '@/types/timer';
import { ETIQUETA_MODO } from '../modoVisual';
import { cn } from '@/lib/utils';

type IndicadorModoProps = {
    modo: Modo;
    estaActivo: boolean;
    // Avanza entre las fases del pomodoro al tocar el nombre
    onClickModo: () => void;
    // Vuelve al pomodoro desde el cronómetro
    onPomodoro: () => void;
    // Pasa al cronómetro
    onCronometro: () => void;
};

/**
 * La fase arriba del reloj: un punto en el acento (late con el reloj corriendo) y el
 * nombre en mayúsculas chicas; tocarlo pasa a la fase siguiente. La flechita, que
 * aparece al acercarse, lleva al cronómetro (o de vuelta al pomodoro).
 */
export function IndicadorModo({ modo, estaActivo, onClickModo, onPomodoro, onCronometro }: IndicadorModoProps) {
    const esCronometro = modo === 'stopwatch';
    const flecha = (
        <button
            type="button"
            onClick={esCronometro ? onPomodoro : onCronometro}
            title={esCronometro ? 'Volver al pomodoro' : 'Pasar a cronómetro'}
            aria-label={esCronometro ? 'Volver al pomodoro' : 'Pasar a cronómetro'}
            className="grid size-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-muted hover:text-foreground [@media(hover:none)]:opacity-70"
        >
            {esCronometro ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
    );

    // z-[1]: con el reloj andando los dígitos crecen (scale) y tapaban la flecha, que no recibía el hover
    return (
        <div className="zona-modo group relative z-[1] inline-flex items-center gap-0.5 [grid-area:modo] justify-self-center">
            {esCronometro && flecha}
            <button
                type="button"
                onClick={esCronometro ? undefined : onClickModo}
                title={esCronometro ? undefined : 'Cambiar de fase'}
                className={cn(
                    'inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.75rem] font-medium tracking-[0.15em] text-muted-foreground uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    !esCronometro && 'hover:bg-muted hover:text-foreground',
                    esCronometro && 'cursor-default',
                )}
            >
                <i className={cn('size-1.5 rounded-full bg-brand', estaActivo && 'animate-[latido_2.4s_ease-in-out_infinite]')} />
                {ETIQUETA_MODO[modo]}
            </button>
            {!esCronometro && flecha}
        </div>
    );
}
