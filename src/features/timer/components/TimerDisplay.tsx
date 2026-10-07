import { useTimer } from '../hooks/useTimerActions';
import DialogShare from './Dialog-Share';
import { RotateCcw } from 'lucide-react';
import { useTimerStore } from '@/store/timerStore';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDocumentPiP } from '@/hooks/useDocumentPiP';
import { FloatingTimer } from './FloatingTimer';
import { MusicPlayer } from '@/features/room/components/MusicPlayer';
import { IndicadorModo } from './IndicadorModo';
import { RelojDigital } from './RelojDigital';
import { ControlesTimer } from './ControlesTimer';
import { claseControl } from '../clasesReloj';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
    enlace: string;
    codigo: string;
    salaId?: string;
    /** Cuántos hay en la sala («Cambia el reloj de los 3»). */
    enLaSala: number;
}

/**
 * La zona del reloj de la sala: la fase arriba, los números en el centro y los
 * controles a los costados (compartir, música y reiniciar a la izquierda; play,
 * ventana flotante y tiempos a la derecha). En angosto los controles bajan.
 * Las clases `zona-*` las apaga index.css con el reloj corriendo y el mouse quieto.
 *
 * La sincronización con Supabase la maneja `useSincronizacionReloj` desde la sala.
 */
export const TimerDisplay = ({ enlace, codigo, salaId, enLaSala }: TimerDisplayProps) => {
    const { tiempoRestante, estaActivo, modo, alternarTemporizador, manejarReinicio, ponerPomodoro, ponerDescansoLargo, ponerDescansoCorto, ponerCronometro } = useTimer();
    const { configuracion, establecerConfiguracion, tiempoInicial } = useTimerStore();

    // Lo que queda de la fase (para la ventana flotante) y lo que ya pasó (para el hilo).
    // El cronómetro no tiene tope, así que no lleva ninguno de los dos.
    const progresoFase = modo === 'stopwatch' || tiempoInicial <= 0
        ? null
        : Math.max(0, Math.min(1, tiempoRestante / tiempoInicial));

    // Tocar el nombre de la fase pasa a la siguiente
    const manejarClickModo = () => {
        if (modo === 'pomodoro') ponerDescansoCorto();
        else if (modo === 'shortBreak') ponerDescansoLargo();
        else ponerPomodoro();
    };
    const { esSoportado, ventanaPiP, solicitarPiP, cerrarPiP } = useDocumentPiP();

    const alternarPiP = async () => {
        if (ventanaPiP) cerrarPiP();
        else await solicitarPiP({ width: 320, height: 240 });
    };

    // Al salir de la sala la ventana flotante se cierra: si no, quedaba en blanco
    useEffect(() => () => cerrarPiP(), [cerrarPiP]);

    return (
        <div className="@container/zona mx-auto flex w-full flex-col items-center">
            {ventanaPiP && createPortal(
                <FloatingTimer
                    tiempoRestante={tiempoRestante}
                    estaActivo={estaActivo}
                    modo={modo}
                    progreso={progresoFase}
                    alAlternar={alternarTemporizador}
                    alCerrar={cerrarPiP}
                />,
                ventanaPiP.document.body
            )}

            {/* Oculta (no desmontada) durante la ventana flotante: la música sigue sonando */}
            <div
                className={cn(
                    'grid grid-cols-2 items-center gap-x-2 gap-y-2.5 [grid-template-areas:"modo_modo"_"reloj_reloj"_"izq_der"]',
                    '@[43.75rem]/zona:grid-cols-[1fr_auto_1fr] @[43.75rem]/zona:gap-x-[clamp(1.75rem,5cqi,4rem)] @[43.75rem]/zona:gap-y-1.5 @[43.75rem]/zona:[grid-template-areas:"._modo_."_"izq_reloj_der"]',
                    ventanaPiP && 'hidden',
                )}
            >
                <IndicadorModo
                    modo={modo}
                    estaActivo={estaActivo}
                    onClickModo={manejarClickModo}
                    onPomodoro={ponerPomodoro}
                    onCronometro={ponerCronometro}
                />
                <div className="zona-controles mt-[1.125rem] flex gap-1.5 [grid-area:izq] justify-self-end @[43.75rem]/zona:mt-0">
                    <DialogShare enlace={enlace} codigo={codigo} />
                    <MusicPlayer salaId={salaId} enLaSala={enLaSala} />
                    <button type="button" onClick={manejarReinicio} className={claseControl} title="Reiniciar" aria-label="Reiniciar el reloj">
                        <RotateCcw />
                    </button>
                </div>
                <RelojDigital
                    tiempoRestante={tiempoRestante}
                    estaActivo={estaActivo}
                    sinEmpezar={!estaActivo && tiempoRestante === tiempoInicial}
                    avance={progresoFase == null ? null : 1 - progresoFase}
                />
                <div className="mt-[1.125rem] @[43.75rem]/zona:mt-0 [grid-area:der] justify-self-start">
                    <ControlesTimer
                        estaActivo={estaActivo}
                        onAlternar={alternarTemporizador}
                        esSoportadoPiP={esSoportado}
                        onAlternarPiP={alternarPiP}
                        configuracion={configuracion}
                        onCambiarConfiguracion={establecerConfiguracion}
                        enLaSala={enLaSala}
                    />
                </div>
            </div>

            {/* Con la ventana flotante abierta, la pestaña muestra el reloj apagado y cómo traerlo */}
            {ventanaPiP && (
                <div className="flex flex-col items-center gap-3.5 py-6 text-center animate-in fade-in duration-500">
                    <div className="flex items-center text-[clamp(3.5rem,13vw,9.375rem)] leading-none font-semibold tracking-[-0.04em] tabular-nums text-foreground/15" aria-hidden>
                        <span>{String(Math.floor(tiempoRestante / 60)).padStart(2, '0')}</span>
                        <span className="mx-[0.12em] inline-flex flex-col gap-[0.2em]" aria-hidden>
                            <i className="size-[0.1em] rounded-full bg-current" />
                            <i className="size-[0.1em] rounded-full bg-current" />
                        </span>
                        <span>{String(tiempoRestante % 60).padStart(2, '0')}</span>
                    </div>
                    <p className="m-0 inline-flex items-center gap-2 text-[0.875rem] text-muted-foreground">
                        <span className="size-1.5 rounded-full bg-primary" />
                        En la ventana flotante
                    </p>
                    <button
                        type="button"
                        onClick={cerrarPiP}
                        className="text-[0.875rem] text-muted-foreground underline decoration-border underline-offset-[3px] hover:text-foreground hover:decoration-current"
                    >
                        Traerlo acá
                    </button>
                </div>
            )}
        </div>
    );
};
