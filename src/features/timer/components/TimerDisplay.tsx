import { useTimer } from '../hooks/useTimerActions';
import { Button } from '@/components/ui/button'
import DialogShare from './Dialog-Share';
import { RotateCcw, PictureInPicture2 } from 'lucide-react';
import { useTimerStore } from '@/store/timerStore';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useDocumentPiP } from '@/hooks/useDocumentPiP';
import { FloatingTimer } from './FloatingTimer';
import { MusicPlayer } from '@/features/room/components/MusicPlayer';
import { IndicadorModo } from './IndicadorModo';
import { RelojDigital } from './RelojDigital';
import { ControlesTimer } from './ControlesTimer';
import type { TimerSettings } from '@/types/timer';

/**
 * Reloj de la sala: contenedor que conecta el store/hook del temporizador con
 * las piezas presentacionales (`IndicadorModo`, `RelojDigital`, `ControlesTimer`)
 * y los controles auxiliares (compartir, música, reset, Picture-in-Picture).
 *
 * Es presentacional respecto de la sala: `salaId` solo se reenvía a `MusicPlayer`.
 * La sincronización del reloj con Supabase la maneja `useSincronizacionReloj`
 * (invocado desde `RoomPage`), no este componente.
 */
export const TimerDisplay = ({ enlace, codigo, salaId }: { enlace: string, codigo: string, salaId?: string }) => {
    const { tiempoRestante, estaActivo, modo, alternarTemporizador, manejarReinicio, ponerPomodoro, ponerDescansoLargo, ponerDescansoCorto, ponerCronometro } = useTimer();
    const { configuracion, establecerConfiguracion } = useTimerStore();

    // Avanza cíclicamente entre las fases al tocar el indicador de modo
    const manejarClickModo = () => {
        if (modo === 'pomodoro') ponerDescansoCorto();
        else if (modo === 'shortBreak') ponerDescansoLargo();
        else ponerPomodoro();
    };
    const { esSoportado, ventanaPiP, solicitarPiP, cerrarPiP } = useDocumentPiP();

    const manejarGuardarConfiguracion = React.useCallback((nuevaConfiguracion: TimerSettings) => {
        establecerConfiguracion(nuevaConfiguracion);
    }, [establecerConfiguracion]);

    // Abre o cierra la ventana flotante (PiP) según su estado actual
    const alternarPiP = async () => {
        if (ventanaPiP) {
            cerrarPiP();
        } else {
            await solicitarPiP({ width: 320, height: 240 });
        }
    };

    // Ocultamos el cursor del body mientras el PiP está activo, como feedback visual
    useEffect(() => {
        if (ventanaPiP) {
            document.body.classList.add('pip-active-body');
        } else {
            document.body.classList.remove('pip-active-body');
        }
        return () => document.body.classList.remove('pip-active-body');
    }, [ventanaPiP]);


    return (
        <div className="flex flex-col items-center justify-center gap-10 w-full max-w-4xl mx-auto">
            {ventanaPiP && createPortal(
                <FloatingTimer
                    tiempoRestante={tiempoRestante}
                    estaActivo={estaActivo}
                    modo={modo}
                    alAlternar={alternarTemporizador}
                    alCerrar={cerrarPiP}
                />,
                ventanaPiP.document.body
            )}

            {/* Mantenemos la UI del reloj montada pero oculta durante el PiP para no
                desmontar el iframe del MusicPlayer */}
            <div className={`${ventanaPiP ? 'hidden' : 'flex'} flex-col md:flex-row items-center justify-center gap-6 md:gap-12 lg:gap-16 py-8 w-full`}>
                {/* Controles Izquierda: Compartir, Música, Reset */}
                <div className="flex items-center gap-3 order-2 md:order-1">
                    <DialogShare enlace={enlace} codigo={codigo} />
                    <MusicPlayer salaId={salaId} />
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={manejarReinicio}
                        className="h-10 w-10 hover:bg-accent transition-all shadow-sm">
                        <RotateCcw className="w-5 h-5" />
                    </Button>
                </div>

                {/* Contenedor del Reloj y el Indicador de Modo */}
                <div className="relative flex flex-col items-center justify-center order-1 md:order-2">
                    <IndicadorModo
                        modo={modo}
                        onClickModo={manejarClickModo}
                        onPomodoro={ponerPomodoro}
                        onCronometro={ponerCronometro}
                    />
                    <RelojDigital tiempoRestante={tiempoRestante} estaActivo={estaActivo} />
                </div>

                {/* Controles Derecha: Play/Pausa, PiP, Configuración */}
                <ControlesTimer
                    estaActivo={estaActivo}
                    onAlternar={alternarTemporizador}
                    esSoportadoPiP={esSoportado}
                    onAlternarPiP={alternarPiP}
                    configuracion={configuracion}
                    onGuardarConfiguracion={manejarGuardarConfiguracion}
                />
            </div>

            {ventanaPiP && (
                <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
                    <div className="flex flex-col items-center gap-2">
                        <PictureInPicture2 className="w-12 h-12 text-muted-foreground opacity-50 mb-2" />
                        <h3 className="text-xl font-medium tracking-tight">Temporizador en ventana</h3>
                        <p className="text-sm text-muted-foreground text-center max-w-[250px]">
                            El reloj se está mostrando ahora en una ventana flotante para mantener tu enfoque.
                        </p>
                    </div>
                    <Button variant="outline" onClick={cerrarPiP}>
                        Devolver a esta pestaña
                    </Button>
                </div>
            )}
        </div >
    );
};
