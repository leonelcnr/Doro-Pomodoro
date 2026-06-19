import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import type { Modo } from '@/types/timer';

type IndicadorModoProps = {
    modo: Modo;
    // Avanza cíclicamente entre las fases del pomodoro al tocar el indicador
    onClickModo: () => void;
    // Vuelve al modo pomodoro (desde cronómetro)
    onPomodoro: () => void;
    // Pasa al modo cronómetro
    onCronometro: () => void;
};

/**
 * Indicador de modo minimalista (presentacional): muestra la fase actual
 * (Pomodoro / Descanso Corto / Descanso Largo / Cronómetro) y permite alternar.
 * Se posiciona en absoluto sobre el reloj, por lo que debe ir dentro de un
 * contenedor `relative`.
 */
export function IndicadorModo({ modo, onClickModo, onPomodoro, onCronometro }: IndicadorModoProps) {
    return (
        <div className="absolute -top-6 md:-top-10 flex items-center justify-center transition-all duration-300 group w-full">
            {modo === 'stopwatch' ? (
                <div className="relative flex items-center justify-center cursor-default">
                    {/* Botón para volver al temporizador */}
                    <div className="absolute right-full mr-1 md:mr-2 flex items-center h-full">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onPomodoro}
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
                        onClick={onClickModo}
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
                            onClick={onCronometro}
                            className="w-6 h-6 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                            title="Ir a cronómetro"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
