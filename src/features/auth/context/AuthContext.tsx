import { useState, useEffect, useMemo } from "react";
import supabase from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import type { Usuario } from "@/types/dominio";
import { AuthContext } from "./useAuth";
import {
    resolverRegresoOAuth,
    cerrarEntradaPendiente,
    persistirRefreshToken,
    conectarGoogleCalendar,
    mapearUsuario,
} from "@/features/auth/authHelpers";


/**
 * Proveedor de autenticación: escucha los cambios de sesión de Supabase y mantiene
 * el usuario actual disponible en toda la app.
 *
 * No hay barrera de entrada: sin sesión, `user` es null y la app se usa igual. La
 * sesión anónima nace recién con lo primero que se guarda (`asegurarSesion`), y la
 * cuenta se elige desde /login (`entrarCon`).
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);
    const [hasGoogleLinked, setHasGoogleLinked] = useState(false);
    const navigate = useNavigate();

    // Conecta Google Calendar (la lógica vive en `authHelpers.conectarGoogleCalendar`)
    const connectGoogleCalendar = conectarGoogleCalendar;

    // Cierra la sesión de la cuenta: se vuelve a usar Doro sin cuenta
    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            setUser(null)
            if (error) throw error
            navigate("/", { replace: true });
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        // Errores al volver del proveedor (o la cuenta que ya existía: entra a ella)
        resolverRegresoOAuth();

        const { data: authListener } = supabase.auth.onAuthStateChange((_evento, sesion) => {
            setCargando(false);
            if (sesion == null) {
                setUser(null);
                setHasGoogleLinked(false);
                return;
            }

            const esAnonimo = sesion.user.is_anonymous ?? false;

            // Registramos si esta sesión tiene una identidad de Google vinculada
            const identidades = sesion.user.identities ?? [];
            setHasGoogleLinked(identidades.some((i) => i.provider === 'google'));

            // Guardamos el refresh token (ver authHelpers.persistirRefreshToken).
            // Fire-and-forget: no bloqueamos el flujo de sesión por esto.
            void persistirRefreshToken(sesion);

            setUser((previo) => {
                // Evitamos recrear el objeto si no cambió (mismo id y mismo estado anónimo)
                if (previo?.id === sesion.user.id && previo?.isAnonymous === esAnonimo) {
                    return previo;
                }
                return mapearUsuario(sesion);
            });

            // Volvió del proveedor ya con cuenta: aviso y regreso a donde estaba
            if (!esAnonimo) {
                const volverA = cerrarEntradaPendiente();
                // Fuera del callback: Supabase recomienda no encadenar trabajo acá adentro
                if (volverA) setTimeout(() => navigate(volverA, { replace: true }), 0);
            }
        });
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate]);



    // Memoizamos el value para no recrear el objeto (ni forzar re-render de los
    // consumidores) en cada render del provider. Las funciones son estables porque
    // solo usan `supabase`/`navigate`; el value cambia al cambiar el estado.
    const valor = useMemo(
        () => ({ user, cargando, connectGoogleCalendar, hasGoogleLinked, signOut }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [user, cargando, hasGoogleLinked]
    );

    return (
        <AuthContext.Provider value={valor}>
            {children}
        </AuthContext.Provider>
    );
};
