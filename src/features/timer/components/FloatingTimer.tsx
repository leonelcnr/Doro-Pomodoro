import { Play, Pause, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Modo } from '@/types/timer';
import { ETIQUETA_MODO, PUNTO_MODO, BARRA_MODO } from '../modoVisual';
import './FloatingTimer.css';

// Props del reloj flotante (se renderiza dentro de la ventana Picture-in-Picture)
interface PropsTemporizadorFlotante {
    tiempoRestante: number;     // Segundos restantes a mostrar
    estaActivo: boolean;        // Para alternar el ícono play/pausa
    modo: Modo;                 // Fase actual, para mostrar el indicador de modo
    progreso: number | null;    // Fracción de tiempo que queda (1 = recién arrancado); null en cronómetro
    alAlternar: () => void;     // Callback al tocar play/pausa
    alCerrar: () => void;       // Callback al cerrar la ventana flotante
}

// Renderiza un número en dos dígitos (decena + unidad)
function DosDigitos({ value }: { value: number }) {
    const decena = Math.floor(value / 10);
    const unidad = value % 10;
    return (
        <span className="inline-flex">
            <span>{decena}</span>
            <span>{unidad}</span>
        </span>
    );
}

/**
 * Versión compacta del reloj pensada para la ventana flotante (PiP).
 * Es "tonta": no tiene lógica de tiempo propia, solo muestra lo que recibe por props.
 *
 * Tiene dos formas, según el tamaño de la ventana (ver `FloatingTimer.css`):
 * expandida (fase + reloj grande + botón redondo) y, por debajo de 256×159,
 * compacta: una píldora horizontal de punto + hora + play, con el progreso como
 * hilo de 2px al pie. En ambas, tocar cualquier parte alterna play/pausa.
 */
export const FloatingTimer = ({ tiempoRestante, estaActivo, modo, progreso, alAlternar, alCerrar }: PropsTemporizadorFlotante) => {
    // El hilo de progreso aparece cuando hay algo que mostrar: una fase recién
    // puesta y en pausa marcaría el 100%, que se lee como una raya y no como progreso.
    const mostrarProgreso = progreso !== null && (estaActivo || progreso < 1);

    return (
        <div className="reloj-flotante relative w-full h-screen bg-background text-foreground font-mono select-none overflow-hidden cursor-pointer"
            onClick={alAlternar}>

            {/* La caja que se reacomoda va aparte del contenedor: un elemento no
                responde a su propia container query (ver FloatingTimer.css) */}
            <div className="reloj-flotante__contenido absolute inset-0 flex flex-col items-center justify-center">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(evento) => { evento.stopPropagation(); alCerrar(); }}
                    className="reloj-flotante__cerrar absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </Button>

                {/* Indicador de modo (solo informativo): punto luminoso + etiqueta de la fase actual */}
                <div className="reloj-flotante__fase mb-4 flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${PUNTO_MODO[modo]}`} />
                    <span className="reloj-flotante__etiqueta text-[10px] sm:text-xs font-sans font-medium tracking-[0.15em] text-muted-foreground uppercase whitespace-nowrap">
                        {ETIQUETA_MODO[modo]}
                    </span>
                </div>

                <div className="reloj-flotante__hora flex items-baseline gap-1 tracking-tighter whitespace-nowrap">
                    <DosDigitos value={Math.floor(tiempoRestante / 60)} />
                    <span className="opacity-50">:</span>
                    <DosDigitos value={tiempoRestante % 60} />
                </div>

                <Button
                    onClick={(evento) => { evento.stopPropagation(); alAlternar(); }}
                    size="icon"
                    variant={estaActivo ? "outline" : "default"}
                    className="reloj-flotante__accion mt-6 h-12 w-12 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95">
                    {estaActivo ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-0.5" />}
                </Button>
            </div>

            {/* Progreso de la fase: solo visible en el modo compacto (el cronómetro no tiene tope) */}
            {mostrarProgreso && (
                <div className="reloj-flotante__progreso absolute inset-x-0 bottom-0 h-0.5 bg-muted">
                    <div
                        className={`h-full transition-[width] duration-1000 ease-linear ${BARRA_MODO[modo]}`}
                        style={{ width: `${progreso * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
};
