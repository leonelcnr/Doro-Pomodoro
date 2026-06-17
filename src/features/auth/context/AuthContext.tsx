import { createContext, useState, useContext, useEffect } from "react";
import supabase from "@/lib/supabase";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";


/**
 * Tipo del contexto de autenticación. Los nombres se mantienen en inglés porque
 * forman la API pública del contexto, consumida también por componentes de
 * plantilla (nav-user, app-sidebar, login-form) que quedan fuera de la traducción.
 */
interface AuthContextType {
    user: any;                                                    // Usuario actual (o null si no hay sesión)
    signInWithGoogle: () => any;                                  // Inicia sesión con Google (OAuth)
    signInWithGithub: () => any;                                  // Inicia sesión con GitHub (OAuth)
    signInWithDiscord: () => any;                                 // Inicia sesión con Discord (OAuth)
    signInAnonymously: () => void;                                // Crea una sesión anónima
    linkAccount: (provider: 'google' | 'github' | 'discord') => any; // Vincula otro proveedor a la cuenta actual
    connectGoogleCalendar: () => Promise<void>;                   // Pide permisos de Google Calendar
    hasGoogleLinked: boolean;                                     // Si la sesión tiene una identidad de Google vinculada
    signOut: () => any;                                           // Cierra la sesión
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    signInWithGoogle: () => { },
    signInWithGithub: () => { },
    signInWithDiscord: () => { },
    signInAnonymously: () => { },
    linkAccount: () => { },
    connectGoogleCalendar: async () => { },
    hasGoogleLinked: false,
    signOut: () => { },
});

/**
 * Proveedor de autenticación: escucha los cambios de sesión de Supabase, expone
 * los métodos de login/logout y mantiene el usuario actual disponible en toda la app.
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<any>(null);
    const [hasGoogleLinked, setHasGoogleLinked] = useState(false);
    const navigate = useNavigate();
    const [params] = useSearchParams();

    // Inicia el flujo OAuth de Google; `prompt: select_account` permite elegir cuenta
    const signInWithGoogle = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: {
                        prompt: 'select_account',
                    }
                }
            })
            if (error) throw error
            return data;
        } catch (error) {
            console.error(error)
        }
    }

    // Inicia el flujo OAuth de GitHub
    const signInWithGithub = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/`,
                }
            })
            if (error) throw error
            return data;
        } catch (error) {
            console.error(error)
        }
    }

    // Inicia el flujo OAuth de Discord
    const signInWithDiscord = async () => {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: `${window.location.origin}/`,
                }
            })
            if (error) throw error
            return data;
        } catch (error) {
            console.error(error)
        }
    }

    // Crea una sesión anónima y guarda un nombre por defecto en localStorage
    const signInAnonymously = async () => {
        try {
            const { data, error } = await supabase.auth.signInAnonymously();
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
            const { data, error } = await supabase.auth.linkIdentity({
                provider: proveedor,
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: proveedor === 'google' ? { prompt: 'select_account' } : undefined,
                }
            })
            if (error) throw error
            return data;
        } catch (error) {
            console.error(error)
        }
    }

    /**
     * Conecta Google Calendar para cualquier tipo de usuario:
     * - Usuarios de Google: se reautentican pidiendo el scope de calendario.
     * - Usuarios de Discord/anónimos: vinculan la identidad de Google con ese scope.
     * Pedimos acceso offline para que Supabase guarde el provider_refresh_token,
     * que luego usará nuestra Edge Function.
     */
    const connectGoogleCalendar = async () => {
        const { data: { session: sesion } } = await supabase.auth.getSession();
        const identidades = sesion?.user?.identities ?? [];
        const tieneGoogle = identidades.some((i: any) => i.provider === 'google');

        const ALCANCE_CALENDARIO = 'https://www.googleapis.com/auth/calendar';
        const REDIRECCION = `${window.location.origin}/calendar`;

        if (tieneGoogle) {
            // Reautenticamos para obtener el scope de calendario (Google entrega refresh_token si se pide 'consent')
            await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: REDIRECCION,
                    scopes: ALCANCE_CALENDARIO,
                    queryParams: { prompt: 'consent', access_type: 'offline' },
                },
            });
        } else {
            // Vinculamos Google a la cuenta existente (Discord/anónima)
            await supabase.auth.linkIdentity({
                provider: 'google',
                options: {
                    redirectTo: REDIRECCION,
                    scopes: ALCANCE_CALENDARIO,
                    queryParams: { prompt: 'consent', access_type: 'offline' },
                },
            });
        }
    };

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
        const paramsHash = new URLSearchParams(window.location.hash.replace('#', '?'));
        const paramsConsulta = new URLSearchParams(window.location.search);
        const codigoError = paramsHash.get('error_code') || paramsConsulta.get('error_code');

        if (codigoError) {
            if (codigoError === 'identity_already_exists') {
                toast.error("Esta cuenta ya está registrada", {
                    description: "La cuenta de Google/Github intentada ya pertenece a otro usuario registrado. Por favor, inicia sesión normalmente con ella."
                });
            } else {
                const descripcionError = paramsHash.get('error_description') || paramsConsulta.get('error_description');
                toast.error("Error de autenticación", {
                    description: descripcionError?.replace(/\+/g, ' ') || "No se pudo vincular la cuenta."
                });
            }
            // Limpiamos la URL para no mostrar el error en las recargas
            window.history.replaceState(null, '', window.location.pathname);
        }

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, sesion) => {
            if (sesion == null) {
                navigate("/login", { replace: true });
            } else {
                const esAnonimo = sesion.user.is_anonymous;
                const nombreAnonimo = localStorage.getItem('anon_name') || 'Anónimo';

                // Registramos si esta sesión tiene una identidad de Google vinculada
                const identidades = sesion.user.identities ?? [];
                setHasGoogleLinked(identidades.some((i: any) => i.provider === 'google'));

                // CORRECCIÓN: guardamos el refresh token en user_metadata porque Supabase Auth a veces
                // no actualiza identity_data al reconectar una cuenta ya existente.
                if (sesion.provider_refresh_token && sesion.provider_refresh_token !== sesion.user.user_metadata?.provider_refresh_token) {
                    supabase.auth.updateUser({
                        data: { provider_refresh_token: sesion.provider_refresh_token }
                    });
                }

                setUser((previo: any) => {
                    // Evitamos recrear el objeto si no cambió (mismo id y mismo estado anónimo)
                    if (previo?.id === sesion.user.id && previo?.isAnonymous === esAnonimo) {
                        return previo;
                    }
                    return {
                        ...sesion.user.user_metadata,
                        id: sesion.user.id,
                        email: esAnonimo ? '' : sesion.user.email,
                        isAnonymous: esAnonimo,
                        name: esAnonimo ? nombreAnonimo : (sesion.user.user_metadata?.name || sesion.user.email?.split("@")[0] || "Usuario"),
                        avatar_url: sesion.user.user_metadata?.avatar_url || "",
                        provider_token: sesion.provider_token ?? null,
                    };
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



    return (
        <AuthContext.Provider value={{ user, signInWithGoogle, signInWithGithub, signInWithDiscord, signInAnonymously, linkAccount, connectGoogleCalendar, hasGoogleLinked, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook de conveniencia para consumir el contexto de autenticación
export const useAuth = () => {
    return useContext(AuthContext);
}
