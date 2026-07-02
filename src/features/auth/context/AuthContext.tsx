import { useState, useEffect, useMemo } from "react";
import supabase from "@/lib/supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { Usuario } from "@/types/dominio";
import { AuthContext } from "./useAuth";
import {
    mostrarErrorOAuthDesdeUrl,
    persistirRefreshToken,
    conectarGoogleCalendar,
    mapearUsuario,
} from "@/features/auth/authHelpers";


/**
 * Proveedor de autenticación: escucha los cambios de sesión de Supabase, expone
 * los métodos de login/logout y mantiene el usuario actual disponible en toda la app.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<Usuario | null>(null);
    const [hasGoogleLinked, setHasGoogleLinked] = useState(false);
    const navigate = useNavigate();
    const [params] = useSearchParams();

    // Inicia el flujo OAuth de Google; `prompt: select_account` permite elegir cuenta
    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: {
                        prompt: 'select_account',
                    }
                }
            })
            if (error) throw error
        } catch (error) {
            console.error(error)
        }
    }

    // Inicia el flujo OAuth de GitHub
    const signInWithGithub = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/`,
                }
            })
            if (error) throw error
        } catch (error) {
            console.error(error)
        }
    }

    // Inicia el flujo OAuth de Discord
    const signInWithDiscord = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: `${window.location.origin}/`,
                }
            })
            if (error) throw error
        } catch (error) {
            console.error(error)
        }
    }

    // Crea una sesión anónima y guarda un nombre por defecto en localStorage
    const signInAnonymously = async () => {
        try {
            const { error } = await supabase.auth.signInAnonymously();
            if (error) throw error;

            if (!localStorage.getItem('anon_name')) {
                localStorage.setItem('anon_name', 'Anónimo');
            }

            // Respetamos el parámetro `redirect` de la URL si existe (ej: venir de una invitación)
            if (params.get("redirect")) {
                const redireccion = params.get("redirect");
                navigate(redireccion ? decodeURIComponent(redireccion) : "/", { replace: true });
            } else {
                navigate("/", { replace: true });
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Vincula una identidad adicional (Google/GitHub/Discord) a la cuenta actual
    const linkAccount = async (proveedor: 'google' | 'github' | 'discord') => {
        try {
            const { error } = await supabase.auth.linkIdentity({
                provider: proveedor,
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: proveedor === 'google' ? { prompt: 'select_account' } : undefined,
                }
            })
            if (error) throw error
        } catch (error) {
            console.error(error)
        }
    }

    // Conecta Google Calendar (la lógica vive en `authHelpers.conectarGoogleCalendar`)
    const connectGoogleCalendar = conectarGoogleCalendar;

    // Cierra la sesión y limpia el usuario en memoria
    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut()
            setUser(null)
            if (error) throw error
        } catch (error) {
            console.error(error)
        }
    }




    useEffect(() => {
        // Interceptamos errores de OAuth o de vinculación que vengan en la URL
        mostrarErrorOAuthDesdeUrl();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, sesion) => {
            if (sesion == null) {
                navigate("/login", { replace: true });
            } else {
                const esAnonimo = sesion.user.is_anonymous ?? false;

                // Registramos si esta sesión tiene una identidad de Google vinculada
                const identidades = sesion.user.identities ?? [];
                setHasGoogleLinked(identidades.some((i) => i.provider === 'google'));

                // Guardamos el refresh token (ver authHelpers.persistirRefreshToken)
                persistirRefreshToken(sesion);

                setUser((previo) => {
                    // Evitamos recrear el objeto si no cambió (mismo id y mismo estado anónimo)
                    if (previo?.id === sesion.user.id && previo?.isAnonymous === esAnonimo) {
                        return previo;
                    }
                    return mapearUsuario(sesion);
                });

                if (params.get("redirect")) {
                    const redireccion = params.get("redirect");
                    navigate(redireccion ? decodeURIComponent(redireccion) : "/", { replace: true });
                }
            }
        });
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate, params]);



    // Memoizamos el value para no recrear el objeto (ni forzar re-render de los
    // consumidores) en cada render del provider. Las funciones son estables porque
    // solo usan `supabase`/`navigate`; el value cambia al cambiar `user`/`hasGoogleLinked`.
    const valor = useMemo(
        () => ({ user, signInWithGoogle, signInWithGithub, signInWithDiscord, signInAnonymously, linkAccount, connectGoogleCalendar, hasGoogleLinked, signOut }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [user, hasGoogleLinked]
    );

    return (
        <AuthContext.Provider value={valor}>
            {children}
        </AuthContext.Provider>
    );
};
