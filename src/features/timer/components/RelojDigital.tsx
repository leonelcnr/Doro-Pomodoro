import { SlidingNumber } from '@/components/animate-ui/primitives/texts/sliding-number';

// Renderiza un número con dígitos animados, con un mínimo de dígitos (padding a
// la izquierda con ceros). Cada SlidingNumber dibuja un rodillo por dígito, así
// que segmentamos el valor en sus dígitos y renderizamos uno por rodillo. Esto
// permite que los minutos crezcan por encima de 99 (cronómetro largo) sin romper
// el layout, manteniendo siempre al menos `minDigitos` (2 para MM y SS).
function Digitos({ value, minDigitos = 2 }: { value: number; minDigitos?: number }) {
    const acotado = Math.max(0, Math.floor(value) || 0);
    const texto = String(acotado).padStart(minDigitos, '0');
    const digitos = texto.split('').map(Number);

    return (
        <span className="inline-flex">
            {digitos.map((digito, indice) => (
                <SlidingNumber key={indice} number={digito} initiallyStable />
            ))}
        </span>
    );
}

/**
 * Reloj minimalista (solo presentacional): muestra SIEMPRE MM:SS en minutos, sin
 * convertir nunca a horas (60 minutos se ven "60:00", no "1:00:00"). Los minutos
 * pueden crecer a 3+ dígitos si el cronómetro es largo. Crece un poco mientras el
 * temporizador está activo.
 *
 * Normaliza el tiempo de entrada (descarta NaN/negativos y lo topa en 5999:59)
 * para no romperse jamás ante un valor corrupto o un cronómetro muy largo.
 */
export function RelojDigital({ tiempoRestante, estaActivo }: { tiempoRestante: number, estaActivo: boolean }) {
    const total = Math.min(
        5999 * 60 + 59, // tope: 5999:59 (~100 h en minutos)
        Math.max(0, Math.floor(tiempoRestante) || 0)
    );
    const minutos = Math.floor(total / 60);
    const segundos = total % 60;

    return (
        <div className={`flex items-baseline gap-2 font-mono ${estaActivo ? 'text-[5rem] md:text-[8rem] lg:text-[9.5rem]' : 'text-[4.5rem] md:text-[7rem] lg:text-[8rem]'} leading-none font-medium tracking-tighter transition-all duration-500 select-none`}>
            <Digitos value={minutos} />
            <span className="opacity-20 transition-all duration-500">:</span>
            <Digitos value={segundos} />
        </div>
    );
}
