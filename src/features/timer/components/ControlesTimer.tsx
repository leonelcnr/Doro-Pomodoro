import { Button } from '@/components/ui/button';
import { Play, Pause, PictureInPicture2 } from 'lucide-react';
import DialogSettings from './DialogSettings';
import type { TimerSettings } from '@/types/timer';

type ControlesTimerProps = {
    estaActivo: boolean;
    // Play/pausa del temporizador
    onAlternar: () => void;
    // Si el navegador soporta Picture-in-Picture (Document PiP)
    esSoportadoPiP: boolean;
    // Abre/cierra la ventana flotante
    onAlternarPiP: () => void;
    configuracion: TimerSettings;
    onGuardarConfiguracion: (configuracion: TimerSettings) => void;
};

/**
 * Controles principales del reloj (presentacional): play/pausa, Picture-in-Picture
 * (si está soportado) y el diálogo de configuración.
 */
export function ControlesTimer({
    estaActivo,
    onAlternar,
    esSoportadoPiP,
    onAlternarPiP,
    configuracion,
    onGuardarConfiguracion,
}: ControlesTimerProps) {
    return (
        <div className="flex items-center gap-3 order-3">
            <Button
                onClick={onAlternar}
                size="icon"
                variant={estaActivo ? "outline" : "default"}
                className={`h-10 w-10 shadow-sm transition-all duration-200 ${!estaActivo && 'bg-primary hover:bg-primary/90'}`}>
                {estaActivo ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
            </Button>
            {esSoportadoPiP && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onAlternarPiP}
                    className="h-10 w-10 text-muted-foreground hover:text-foreground transition-all shadow-sm"
                    title="Abrir en ventana flotante"
                >
                    <PictureInPicture2 className="w-5 h-5" />
                </Button>
            )}
            <DialogSettings configuracionActual={configuracion} alGuardarConfiguracion={onGuardarConfiguracion} />
        </div>
    );
}
