import { Minus, Plus, Settings } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import type { TimerSettings } from '@/types/timer';
import { claseControl, clasePanel, claseRotulo } from '../clasesReloj';

const FASES = [
    { clave: 'pomodoro', nombre: 'Pomodoro', max: 180 },
    { clave: 'shortBreak', nombre: 'Descanso corto', max: 60 },
    { clave: 'longBreak', nombre: 'Descanso largo', max: 90 },
] as const;

interface PanelTiemposProps {
    configuracion: TimerSettings;
    onCambiar: (configuracion: TimerSettings) => void;
    /** Cuántos hay en la sala, para «Cambia el reloj de los 3». */
    enLaSala: number;
}

/**
 * Los tiempos del reloj (C1): un panel chico pegado al engranaje, con un renglón por
 * fase (− número +) y el descanso automático. Se aplica al toque, sin «Guardar».
 */
export function PanelTiempos({ configuracion, onCambiar, enLaSala }: PanelTiemposProps) {
    const ajustar = (clave: (typeof FASES)[number]['clave'], paso: number, max: number) =>
        onCambiar({ ...configuracion, [clave]: Math.max(1, Math.min(max, configuracion[clave] + paso)) });

    return (
        <Popover>
            <PopoverTrigger className={claseControl} title="Tiempos del reloj" aria-label="Tiempos del reloj">
                <Settings />
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className={clasePanel}>
                <p className={`${claseRotulo} m-0 mb-1.5`}>Tiempos</p>
                {FASES.map(({ clave, nombre, max }) => (
                    <div key={clave} className="flex min-h-12 items-center gap-2 border-b">
                        <span className="flex-1 text-[0.875rem]">{nombre}</span>
                        <button type="button" onClick={() => ajustar(clave, -1, max)} aria-label={`${nombre}: un minuto menos`} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Minus className="size-3.5" />
                        </button>
                        <b className="min-w-8 text-center text-[1.0625rem] font-semibold tabular-nums">{configuracion[clave]}</b>
                        <button type="button" onClick={() => ajustar(clave, 1, max)} aria-label={`${nombre}: un minuto más`} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Plus className="size-3.5" />
                        </button>
                        <span className="text-[0.75rem] text-muted-foreground">min</span>
                    </div>
                ))}
                <label className="flex min-h-12 items-center justify-between gap-3 text-[0.875rem]">
                    Arrancar el descanso solo
                    <Switch checked={configuracion.autoBreak} onCheckedChange={(autoBreak) => onCambiar({ ...configuracion, autoBreak })} />
                </label>
                <p className="m-0 mt-2 text-[0.78125rem] text-muted-foreground">
                    {enLaSala > 1 ? `Cambia el reloj de los ${enLaSala}.` : 'Cambia el reloj de la sala.'}
                </p>
            </PopoverContent>
        </Popover>
    );
}
