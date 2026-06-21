import { useEffect, useState } from "react";

/**
 * Mantiene la hora actual y la refresca en cada cambio de minuto. El primer
 * tick se sincroniza con el borde del minuto y luego refresca cada 60s, así
 * el reloj del saludo (header de inicio) no re-renderiza cada segundo.
 */
export function useHoraActual(): Date {
    const [ahora, establecerAhora] = useState(() => new Date());

    useEffect(() => {
        let intervalId: number | undefined;

        const msHastaProximoMinuto = 60000 - (Date.now() % 60000);
        const timeoutId = window.setTimeout(() => {
            establecerAhora(new Date());
            intervalId = window.setInterval(() => establecerAhora(new Date()), 60000);
        }, msHastaProximoMinuto);

        return () => {
            window.clearTimeout(timeoutId);
            if (intervalId !== undefined) window.clearInterval(intervalId);
        };
    }, []);

    return ahora;
}
