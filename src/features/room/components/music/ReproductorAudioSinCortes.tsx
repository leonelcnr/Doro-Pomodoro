import { useRef, useEffect } from "react";

/**
 * Reproductor de audio en bucle sin cortes (gapless). Usa dos elementos <audio>
 * en "ping-pong" y hace un crossfade de potencia constante entre el final de una
 * vuelta y el inicio de la siguiente, evitando el silencio del corte del loop.
 * No renderiza nada (solo controla audio), de ahí que devuelva null.
 */
export function ReproductorAudioSinCortes({ fuente, volumenObjetivo, reproduciendo }: { fuente: string, volumenObjetivo: number, reproduciendo: boolean }) {
    const audioA = useRef<HTMLAudioElement | null>(null);
    const audioB = useRef<HTMLAudioElement | null>(null);
    const audioActivo = useRef<'A' | 'B'>('A');

    // Configuración inicial de los audios (buffers ping-pong)
    useEffect(() => {
        audioA.current = new Audio(fuente);
        audioB.current = new Audio(fuente);
        audioA.current.preload = "auto";
        audioB.current.preload = "auto";

        return () => {
            audioA.current?.pause();
            audioA.current?.removeAttribute('src');
            audioB.current?.pause();
            audioB.current?.removeAttribute('src');
        };
    }, [fuente]);

    // Lógica de bucle y crossfade suave (equal-power)
    useEffect(() => {
        const TIEMPO_CROSSFADE = 2.0; // 2 segundos de transición entre loops

        const idIntervalo = setInterval(() => {
            if (!reproduciendo || volumenObjetivo === 0) return;

            const a = audioA.current;
            const b = audioB.current;
            if (!a || !b) return;

            const volumenMax = volumenObjetivo / 100;
            const actual = audioActivo.current === 'A' ? a : b;
            const siguiente = audioActivo.current === 'A' ? b : a;

            // Nos aseguramos de que el audio actual esté reproduciéndose
            if (actual.paused) {
                actual.play().catch(() => { });
            }

            // Si entramos en la zona de crossfade (cerca del final)
            if (actual.duration && actual.currentTime >= actual.duration - TIEMPO_CROSSFADE) {
                if (siguiente.paused) {
                    siguiente.currentTime = 0;
                    siguiente.volume = 0;
                    siguiente.play().catch(() => { });
                }

                const solapamiento = actual.duration - actual.currentTime; // Baja desde TIEMPO_CROSSFADE hasta 0
                const proporcion = Math.max(0, Math.min(1, solapamiento / TIEMPO_CROSSFADE)); // Baja de 1 a 0

                // Crossfade de potencia constante usando coseno (evita bajones de volumen)
                actual.volume = volumenMax * Math.cos((1 - proporcion) * 0.5 * Math.PI);
                siguiente.volume = volumenMax * Math.cos(proporcion * 0.5 * Math.PI);

                // Si se agotó el solapamiento o el navegador frenó el timer y se pasó
                if (solapamiento <= 0.25 || actual.ended) {
                    actual.pause();
                    actual.currentTime = 0;
                    audioActivo.current = audioActivo.current === 'A' ? 'B' : 'A';
                    siguiente.volume = volumenMax;
                }
            } else {
                actual.volume = volumenMax;
            }
        }, 100);

        if (!reproduciendo || volumenObjetivo === 0) {
            audioA.current?.pause();
            audioB.current?.pause();
        }

        return () => {
            clearInterval(idIntervalo);
        };
    }, [reproduciendo, volumenObjetivo]);

    return null;
}
