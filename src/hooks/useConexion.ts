import { useEffect, useState } from "react";

/**
 * ¿Hay conexión? Escucha `online`/`offline` del navegador. `canalCaido` suma lo que
 * sabe quien maneja el canal de Supabase (CHANNEL_ERROR o TIMED_OUT): también cuenta
 * como sin conexión. Con la conexión caída el reloj sigue local; se sincroniza al volver.
 */
export function useConexion(canalCaido = false): boolean {
    const [enLinea, establecerEnLinea] = useState(() => navigator.onLine);

    useEffect(() => {
        const si = () => establecerEnLinea(true);
        const no = () => establecerEnLinea(false);
        window.addEventListener("online", si);
        window.addEventListener("offline", no);
        return () => {
            window.removeEventListener("online", si);
            window.removeEventListener("offline", no);
        };
    }, []);

    return enLinea && !canalCaido;
}
