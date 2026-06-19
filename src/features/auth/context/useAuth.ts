import { createContext, useContext } from "react";
import type { Usuario } from "@/types/dominio";

/**
 * Tipo del contexto de autenticación. Los nombres de los métodos se mantienen en
 * inglés porque forman la API pública del contexto, consumida también por
 * componentes de plantilla (nav-user, app-sidebar, login-form) que quedan fuera
 * de la traducción. El usuario sí usa el contrato de dominio `Usuario`.
 */
export interface AuthContextType {
    user: Usuario | null;                                         // Usuario actual (o null si no hay sesión)
    signInWithGoogle: () => Promise<void>;                        // Inicia sesión con Google (OAuth)
    signInWithGithub: () => Promise<void>;                        // Inicia sesión con GitHub (OAuth)
    signInWithDiscord: () => Promise<void>;                       // Inicia sesión con Discord (OAuth)
    signInAnonymously: () => Promise<void>;                       // Crea una sesión anónima
    linkAccount: (provider: 'google' | 'github' | 'discord') => Promise<void>; // Vincula otro proveedor a la cuenta actual
    connectGoogleCalendar: () => Promise<void>;                   // Pide permisos de Google Calendar
    hasGoogleLinked: boolean;                                     // Si la sesión tiene una identidad de Google vinculada
    signOut: () => Promise<void>;                                 // Cierra la sesión
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    signInWithGoogle: async () => { },
    signInWithGithub: async () => { },
    signInWithDiscord: async () => { },
    signInAnonymously: async () => { },
    linkAccount: async () => { },
    connectGoogleCalendar: async () => { },
    hasGoogleLinked: false,
    signOut: async () => { },
});

// Hook de conveniencia para consumir el contexto de autenticación
export const useAuth = () => useContext(AuthContext);
