import { useLocation, useNavigate } from "react-router-dom"
import { useTheme } from "next-themes"

import { useAuth } from "@/features/auth/context/useAuth"
import { useAcento } from "@/hooks/useAcento"
import { MenuCuenta } from "./MenuCuenta"

/**
 * `MenuCuenta` conectado a la sesión, al tema y al acento. Lo usan el encabezado de
 * las páginas y la barra de la sala, así el avatar abre el mismo menú en los dos.
 */
export function MenuCuentaApp({ claseAvatar }: { claseAvatar?: string }) {
    const { user, cargando, signOut } = useAuth()
    const { theme, setTheme } = useTheme()
    const [acento, cambiarAcento] = useAcento()
    const navigate = useNavigate()
    const { pathname } = useLocation()

    // La cuenta se elige en /login, que después vuelve a esta misma página
    const irALogin = () =>
        navigate(pathname === "/" ? "/login" : `/login?redirect=${encodeURIComponent(pathname)}`)

    // El nombre del anónimo vive en localStorage; se recarga para que lo tome toda la app
    // (en la sala, también la presencia: los demás lo ven con el nombre nuevo)
    const guardarNombre = (nombre: string) => {
        localStorage.setItem("anon_name", nombre)
        window.location.reload()
    }

    return (
        <MenuCuenta
            usuario={user}
            cargando={cargando}
            tema={theme}
            onCambiarTema={setTheme}
            acento={acento}
            onCambiarAcento={cambiarAcento}
            onEntrar={irALogin}
            onCerrarSesion={signOut}
            onGuardarNombre={guardarNombre}
            claseAvatar={claseAvatar}
        />
    )
}
