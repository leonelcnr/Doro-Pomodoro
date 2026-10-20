import { useState } from 'react';
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
 * fase (− número +, y el número se puede escribir) y el descanso automático. Se aplica al toque, sin «Guardar».
 */
export function PanelTiempos({ configuracion, onCambiar, enLaSala }: PanelTiemposProps) {
    const fijar = (clave: (typeof FASES)[number]['clave'], minutos: number, max: number) => {
        const acotado = Math.max(1, Math.min(max, minutos));
        if (acotado !== configuracion[clave]) onCambiar({ ...configuracion, [clave]: acotado });
    };

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
                        <button type="button" onClick={() => fijar(clave, configuracion[clave] - 1, max)} aria-label={`${nombre}: un minuto menos`} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                            <Minus className="size-3.5" />
                        </button>
                        <CampoMinutos nombre={nombre} valor={configuracion[clave]} max={max} onConfirmar={(minutos) => fijar(clave, minutos, max)} />
                        <button type="button" onClick={() => fijar(clave, configuracion[clave] + 1, max)} aria-label={`${nombre}: un minuto más`} className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
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

interface CampoMinutosProps {
    nombre: string;
    valor: number;
    max: number;
    onConfirmar: (minutos: number) => void;
}

/**
 * El número de cada fase, que también se escribe a mano. Mientras se escribe vive en un
 * borrador local (para no mandarle a la sala un 1 cuando se va a tipear 15) y se confirma
 * con Enter o al salir del campo; Escape o un campo vacío vuelven al valor de antes. Sin
 * borrador muestra el valor de la sala, así que acompaña los cambios de los demás.
 */
function CampoMinutos({ nombre, valor, max, onConfirmar }: CampoMinutosProps) {
    const [borrador, setBorrador] = useState<string | null>(null);

    const confirmar = () => {
        if (borrador === null) return;
        const minutos = Number.parseInt(borrador, 10);
        if (!Number.isNaN(minutos)) onConfirmar(minutos);
        setBorrador(null);
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            aria-label={`${nombre}, en minutos (de 1 a ${max})`}
            value={borrador ?? String(valor)}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setBorrador(e.target.value.replace(/\D/g, ''))}
            onBlur={confirmar}
            onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                else if (e.key === 'Escape') setBorrador(null);
                else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    onConfirmar(valor + (e.key === 'ArrowUp' ? 1 : -1));
                    setBorrador(null);
                }
            }}
            className="w-10 rounded-md bg-transparent py-0.5 text-center text-[1.0625rem] font-semibold tabular-nums outline-none hover:bg-muted focus:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50"
        />
    );
}
