import { SlidingNumber } from '@/components/animate-ui/primitives/texts/sliding-number';

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
 * Reloj minimalista (solo presentacional): muestra MM:SS con dígitos animados.
 * Crece un poco mientras el temporizador está activo.
 */
export function RelojDigital({ tiempoRestante, estaActivo }: { tiempoRestante: number, estaActivo: boolean }) {
    return (
        <div className={`flex items-baseline gap-2 font-mono ${estaActivo ? 'text-[5rem] md:text-[8rem] lg:text-[9.5rem]' : 'text-[4.5rem] md:text-[7rem] lg:text-[8rem]'} leading-none font-medium tracking-tighter transition-all duration-500 select-none`}>
            <DosDigitos value={Math.floor(tiempoRestante / 60)} />
            <span className={`opacity-20 transition-all duration-500`}>:</span>
            <DosDigitos value={tiempoRestante % 60} />
        </div>
    );
}
