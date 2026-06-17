import { useTimer } from '../hooks/useTimerActions';
import { Button } from '@/components/ui/button'
import { SlidingNumber } from '@/components/animate-ui/primitives/texts/sliding-number'
import DialogShare from './Dialog-Share';
import DialogSettings from './DialogSettings';
import { Play, Pause, RotateCcw, Copy, PictureInPicture2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTimerStore } from '@/store/timerStore';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import * as salasService from '@/features/room/services/salasService';
import { useDocumentPiP } from '@/hooks/useDocumentPiP';
import { FloatingTimer } from './FloatingTimer';
import { MusicPlayer } from '@/features/room/components/MusicPlayer';
import type { TimerSettings } from '@/types/timer';

// Renderiza un número en dos dígitos animados (decena + unidad)
function DosDigitos({ value }: { value: number }) {
    const decena = Math.floor(value / 10);
    const unidad = value % 10;

    return (
        <span className="inline-flex">
            <SlidingNumber number={decena} initiallyStable />
            <SlidingNumber number={unidad} initiallyStable />
        </span>
    );
}

/**
 * Componente principal del reloj: muestra el tiempo, el indicador de modo y los
 * controles (compartir, música, reset, play/pausa, PiP y configuración).
 * Si recibe `salaId`, sincroniza cada cambio local de estado hacia Supabase.
 */
export const TimerDisplay = ({ enlace, codigo, salaId }: { enlace: string, codigo: string, salaId?: string }) => {
    const { tiempoRestante, estaActivo, modo, alternarTemporizador, manejarReinicio, ponerPomodoro, ponerDescansoLargo, ponerDescansoCorto, ponerCronometro } = useTimer();
    const { configuracion, establecerConfiguracion, ultimaActualizacionLocal } = useTimerStore();

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

    // Sincroniza hacia Supabase cuando se detecta un cambio de estado local
    React.useEffect(() => {
        // Solo sincronizamos si hay sala y existe un cambio originado en este cliente
        if (!salaId || !ultimaActualizacionLocal) return;

        const sincronizarConSupabase = async () => {
            const estado = useTimerStore.getState();
            // Objeto que se guarda en la columna `timer_state` y se comparte entre clientes
            const nuevoEstado = {
                tiempoRestante: estado.tiempoRestante,
                estaActivo: estado.estaActivo,
                modo: estado.modo,
                actualizadoEn: new Date().toISOString()
            };

            // Subimos el estado a Supabase a través del servicio de salas
            try {
                await salasService.guardarEstadoReloj(salaId, nuevoEstado);
            } catch (error) {
                console.error("Error al actualizar el temporizador:", error);
            }
        };

        sincronizarConSupabase();
    }, [ultimaActualizacionLocal, salaId]);


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
                    {/* Indicador de Modo Minimalista */}
                    <div className="absolute -top-6 md:-top-10 flex items-center justify-center transition-all duration-300 group w-full">
                        {modo === 'stopwatch' ? (
                            <div className="relative flex items-center justify-center cursor-default">
                                {/* Botón para volver al temporizador */}
                                <div className="absolute right-full mr-1 md:mr-2 flex items-center h-full">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={ponerPomodoro}
                                        className="w-6 h-6 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                                        title="Volver a Temporizador"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors select-none">
                                    <div className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.5)] transition-colors duration-300" />
                                    <span className="text-[10px] sm:text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase whitespace-nowrap">
                                        Cronómetro
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="relative flex items-center justify-center">
                                <button
                                    onClick={manejarClickModo}
                                    className="flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 md:px-3 px-2 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${modo === 'pomodoro' ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]' :
                                        modo === 'shortBreak' ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]' :
                                            'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.5)]'
                                        }`} />
                                    <span className="text-[10px] sm:text-xs font-medium tracking-[0.15em] text-muted-foreground uppercase select-none whitespace-nowrap">
                                        {modo === 'pomodoro' ? 'Pomodoro' : modo === 'shortBreak' ? 'Descanso Corto' : 'Descanso Largo'}
                                    </span>
                                </button>

                                {/* Botón para ir a cronómetro */}
                                <div className="absolute left-full ml-1 md:ml-2 flex items-center h-full">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={ponerCronometro}
                                        className="w-6 h-6 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                                        title="Ir a cronómetro"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* El Reloj Minimalista */}
                    <div className={`flex items-baseline gap-2 font-mono ${estaActivo ? 'text-[5rem] md:text-[8rem] lg:text-[9.5rem]' : 'text-[4.5rem] md:text-[7rem] lg:text-[8rem]'} leading-none font-medium tracking-tighter transition-all duration-500 select-none`}>
                        <DosDigitos value={Math.floor(tiempoRestante / 60)} />
                        <span className={`opacity-20 transition-all duration-500`}>:</span>
                        <DosDigitos value={tiempoRestante % 60} />
                    </div>
                </div>

                {/* Controles Derecha: Play/Pausa, PiP, Configuración */}
                <div className="flex items-center gap-3 order-3">
                    <Button
                        onClick={alternarTemporizador}
                        size="icon"
                        variant={estaActivo ? "outline" : "default"}
                        className={`h-10 w-10 shadow-sm transition-all duration-200 ${!estaActivo && 'bg-primary hover:bg-primary/90'}`}>
                        {estaActivo ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-1" />}
                    </Button>
                    {esSoportado && (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={alternarPiP}
                            className="h-10 w-10 text-muted-foreground hover:text-foreground transition-all shadow-sm"
                            title="Abrir en ventana flotante"
                        >
                            <PictureInPicture2 className="w-5 h-5" />
                        </Button>
                    )}
                    <DialogSettings configuracionActual={configuracion} alGuardarConfiguracion={manejarGuardarConfiguracion} />
                </div>
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
