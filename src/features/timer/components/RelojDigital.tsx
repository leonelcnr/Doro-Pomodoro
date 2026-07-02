import { SlidingNumber } from '@/components/animate-ui/primitives/texts/sliding-number';

// Renderiza un número en dos dígitos animados (decena + unidad). Se acota a [0, 99]
// para que un valor fuera de rango nunca desborde el reloj (cada SlidingNumber
// dibuja un rodillo por dígito: con 3+ dígitos se solaparían y romperían el layout).
function DosDigitos({ value }: { value: number }) {
    const acotado = Math.min(99, Math.max(0, Math.floor(value) || 0));
    const decena = Math.floor(acotado / 10);
    const unidad = acotado % 10;

    return (
        <span className="inline-flex">
            <SlidingNumber number={decena} initiallyStable />
            <SlidingNumber number={unidad} initiallyStable />
        </span>
    );
}

/**
 * Reloj minimalista (solo presentacional): muestra MM:SS (o H:MM:SS si supera la
 * hora) con dígitos animados. Crece un poco mientras el temporizador está activo.
 *
 * Normaliza el tiempo de entrada (descarta NaN/negativos y lo topa en 99:59:59)
 * para no romperse jamás ante un valor corrupto o un cronómetro muy largo.
 */
export function RelojDigital({ tiempoRestante, estaActivo }: { tiempoRestante: number, estaActivo: boolean }) {
    const total = Math.min(
        99 * 3600 + 59 * 60 + 59, // tope: 99:59:59
        Math.max(0, Math.floor(tiempoRestante) || 0)
    );
    const horas = Math.floor(total / 3600);
    const minutos = Math.floor((total % 3600) / 60);
    const segundos = total % 60;

    return (
        <div className={`flex items-baseline gap-2 font-mono ${estaActivo ? 'text-[5rem] md:text-[8rem] lg:text-[9.5rem]' : 'text-[4.5rem] md:text-[7rem] lg:text-[8rem]'} leading-none font-medium tracking-tighter transition-all duration-500 select-none`}>
            {horas > 0 && (
                <>
                    <DosDigitos value={horas} />
                    <span className="opacity-20 transition-all duration-500">:</span>
                </>
            )}
            <DosDigitos value={minutos} />
            <span className="opacity-20 transition-all duration-500">:</span>
            <DosDigitos value={segundos} />
        </div>
    );
}
