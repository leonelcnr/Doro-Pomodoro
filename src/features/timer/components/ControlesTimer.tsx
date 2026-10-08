import { Pause, Play, PictureInPicture2 } from 'lucide-react';
import type { TimerSettings } from '@/types/timer';
import { claseControl } from '../clasesReloj';
import { cn } from '@/lib/utils';
import { PanelTiempos } from './PanelTiempos';

type ControlesTimerProps = {
    estaActivo: boolean;
    onAlternar: () => void;
    // Si el navegador soporta la ventana flotante (Document PiP)
    esSoportadoPiP: boolean;
    onAlternarPiP: () => void;
    configuracion: TimerSettings;
    onCambiarConfiguracion: (configuracion: TimerSettings) => void;
    enLaSala: number;
};

/**
 * Los controles a la derecha del reloj: play (en el acento; corriendo pasa a un
 * borde fino con la pausa), la ventana flotante y los tiempos.
 */
export function ControlesTimer({ estaActivo, onAlternar, esSoportadoPiP, onAlternarPiP, configuracion, onCambiarConfiguracion, enLaSala }: ControlesTimerProps) {
    return (
        <div className="zona-controles flex gap-1.5">
            <button
                type="button"
                onClick={onAlternar}
                aria-label={estaActivo ? 'Pausar' : 'Iniciar'}
                className={cn(
                    claseControl,
                    estaActivo
                        ? 'border-border text-foreground'
                        : 'bg-brand-strong text-brand-foreground hover:bg-brand-strong/90 hover:text-brand-foreground',
                )}
            >
                {estaActivo ? <Pause className="fill-current" /> : <Play className="fill-current" />}
            </button>
            {esSoportadoPiP && (
                <button type="button" onClick={onAlternarPiP} className={claseControl} title="Ventana flotante" aria-label="Abrir en ventana flotante">
                    <PictureInPicture2 />
                </button>
            )}
            <PanelTiempos configuracion={configuracion} onCambiar={onCambiarConfiguracion} enLaSala={enLaSala} />
        </div>
    );
}
