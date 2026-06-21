import React from 'react';
import { Play, Pause, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Modo } from '@/types/timer';
import { ETIQUETA_MODO, PUNTO_MODO } from '../modoVisual';

// Props del reloj flotante (se renderiza dentro de la ventana Picture-in-Picture)
interface PropsTemporizadorFlotante {
    tiempoRestante: number;     // Segundos restantes a mostrar
    estaActivo: boolean;        // Para alternar el ícono play/pausa
    modo: Modo;                 // Fase actual, para mostrar el indicador de modo
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
 */
export const FloatingTimer = ({ tiempoRestante, estaActivo, modo, alAlternar, alCerrar }: PropsTemporizadorFlotante) => {
    return (
        <div className="flex flex-col items-center justify-center w-full h-screen bg-background text-foreground font-mono select-none overflow-hidden"
            style={{ margin: 0, padding: 0 }}>
            <div className="absolute top-2 right-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={alCerrar}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Indicador de modo (solo informativo): punto luminoso + etiqueta de la fase actual */}
            <div className="mb-4 flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${PUNTO_MODO[modo]}`} />
                <span className="text-[10px] sm:text-xs font-sans font-medium tracking-[0.15em] text-muted-foreground uppercase whitespace-nowrap">
                    {ETIQUETA_MODO[modo]}
                </span>
            </div>

            <div className="flex items-baseline gap-1 text-6xl tracking-tighter cursor-pointer" onClick={alAlternar}>
                <DosDigitos value={Math.floor(tiempoRestante / 60)} />
                <span className="opacity-50">:</span>
                <DosDigitos value={tiempoRestante % 60} />
            </div>

            <div className="mt-6 flex gap-4">
                <Button
                    onClick={alAlternar}
                    size="icon"
                    variant={estaActivo ? "outline" : "default"}
                    className="h-12 w-12 rounded-full shadow-sm transition-all hover:scale-105 active:scale-95">
                    {estaActivo ? <Pause className="fill-current w-5 h-5" /> : <Play className="fill-current w-5 h-5 ml-0.5" />}
                </Button>
            </div>
        </div>
    );
};
