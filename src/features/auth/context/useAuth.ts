import { createContext, useContext } from "react";
import type { Usuario } from "@/types/dominio";

/**
 * Tipo del contexto de autenticación. Los nombres de los métodos se mantienen en
 * inglés porque forman la API pública del contexto, consumida también por
 * componentes de plantilla (nav-user, app-sidebar) que quedan fuera de la
 * traducción. El usuario sí usa el contrato de dominio `Usuario`.
 *
 * Entrar con un proveedor (`entrarCon`) y crear la sesión anónima
 * (`asegurarSesion`) viven en `authHelpers`: no dependen del estado de React.
 */
export interface AuthContextType {
    user: Usuario | null;                                         // Usuario actual (null: sin sesión todavía)
    cargando: boolean;                                            // Mientras Supabase lee la sesión guardada
    connectGoogleCalendar: () => Promise<void>;                   // Pide permisos de Google Calendar
    hasGoogleLinked: boolean;                                     // Si la sesión tiene una identidad de Google vinculada
    signOut: () => Promise<void>;                                 // Cierra la sesión de la cuenta
}

export const AuthContext = createContext<AuthContextType>({
    user: null,
    cargando: true,
    connectGoogleCalendar: async () => { },
    hasGoogleLinked: false,
    signOut: async () => { },
});

// Hook de conveniencia para consumir el contexto de autenticación
export const useAuth = () => useContext(AuthContext);
