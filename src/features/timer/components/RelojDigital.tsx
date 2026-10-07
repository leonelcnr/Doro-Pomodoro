import { cn } from '@/lib/utils';

/** Cada dígito entra desde arriba cuando cambia (la `key` lo vuelve a montar). Sin blur: son enormes. */
function Digitos({ valor }: { valor: number }) {
    const texto = String(valor).padStart(2, '0');
    return (
        <span className="inline-flex">
            {texto.split('').map((d, i) => (
                <span key={`${i}-${d}`} className="inline-block w-[0.6em] animate-[digito_0.42s_cubic-bezier(.16,1,.3,1)] text-center">
                    {d}
                </span>
            ))}
        </span>
    );
}

interface RelojDigitalProps {
    tiempoRestante: number;
    estaActivo: boolean;
    /** Todavía no arrancó la fase: los números van un poco apagados. */
    sinEmpezar: boolean;
    /** 0 a 1, lo que ya pasó de la fase; null en el cronómetro (no lleva hilo). */
    avance: number | null;
}

/**
 * Los números de la sala: MM:SS siempre en minutos (60 minutos se ven «60:00»),
 * con dos puntos redondos. Corriendo, crece un poco y aparece el hilo debajo, que
 * avanza con la fase; en pausa se desvanece.
 */
export function RelojDigital({ tiempoRestante, estaActivo, sinEmpezar, avance }: RelojDigitalProps) {
    // Tope de 5999:59 y nada de NaN o negativos: un valor corrupto no rompe el reloj
    const total = Math.min(5999 * 60 + 59, Math.max(0, Math.floor(tiempoRestante) || 0));

    return (
        <div
            role="timer"
            aria-label="Tiempo restante"
            className={cn(
                'relative flex items-center justify-self-center text-[clamp(3.5rem,17cqi,11.5rem)] leading-none font-semibold tracking-[-0.04em] tabular-nums transition-[scale,color] duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] select-none [grid-area:reloj]',
                estaActivo && 'scale-[1.035]',
                sinEmpezar && 'text-foreground/88',
            )}
        >
            <Digitos valor={Math.floor(total / 60)} />
            <span aria-hidden className="mx-[0.14em] inline-flex flex-col gap-[0.2em]">
                <i className="size-[0.1em] rounded-full bg-muted-foreground/70" />
                <i className="size-[0.1em] rounded-full bg-muted-foreground/70" />
            </span>
            <Digitos valor={total % 60} />
            {avance != null && (
                <span
                    aria-hidden
                    className={cn(
                        'absolute inset-x-[0.14em] -bottom-[0.2em] h-0.5 overflow-hidden rounded-full bg-border transition-opacity duration-[600ms]',
                        estaActivo ? 'opacity-100' : 'opacity-0 delay-300',
                    )}
                >
                    <i className="absolute inset-0 origin-left bg-brand transition-[scale] duration-1000 ease-linear" style={{ scale: `${avance} 1` }} />
                </span>
            )}
        </div>
    );
}
