import type { ReactNode } from "react"
import { IconInnerShadowTop } from "@tabler/icons-react"
import { Menu } from "lucide-react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatearHora } from "@/features/home/saludo"
import { useHoraActual } from "@/features/home/hooks/useHoraActual"
import { cn } from "@/lib/utils"
import { MenuCuentaApp } from "./MenuCuentaApp"

// Secciones de la app. El calendario vive adentro de Tareas.
const SECCIONES = [
    { ruta: "/", nombre: "Inicio" },
    { ruta: "/tareas", nombre: "Tareas" },
    { ruta: "/dashboard", nombre: "Dashboard" },
] as const

interface EncabezadoAppProps {
    /** Lo que la página suma antes del avatar (p. ej. el contador de tareas del home). */
    extra?: ReactNode
}

/**
 * Encabezado de las páginas principales (diseño del home D4). Con mouse se
 * desvanece y deja solo el logo, `extra` y el avatar; vuelve al pasar el puntero o
 * al llegar con Tab, y se va medio segundo después. En pantallas táctiles queda
 * completo. Las reglas viven en index.css (`.encabezado .desvanece`).
 */
export function EncabezadoApp({ extra }: EncabezadoAppProps) {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const hora = formatearHora(useHoraActual())


    return (
        <header className="encabezado flex h-14 shrink-0 items-center gap-6 px-5 md:px-8">
            <Link
                to="/"
                aria-label="Doro, inicio"
                className="inline-flex items-center gap-2 rounded-md font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <IconInnerShadowTop className="size-[1.375rem] text-brand" aria-hidden />
                <span className="desvanece">Doro</span>
            </Link>

            <nav aria-label="Secciones" className="desvanece hidden gap-1 sm:flex">
                {SECCIONES.map(({ ruta, nombre }) => (
                    <NavLink
                        key={ruta}
                        to={ruta}
                        end
                        className={({ isActive }) =>
                            cn(
                                "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
                                isActive && "bg-muted text-foreground",
                            )
                        }
                    >
                        {nombre}
                    </NavLink>
                ))}
            </nav>

            <div className="ml-auto flex items-center gap-3.5">
                <span className="desvanece text-sm tabular-nums text-muted-foreground">{hora}</span>
                {extra}
                <MenuCuentaApp />

                {/* En pantallas angostas las secciones van en un menú */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        aria-label="Secciones"
                        className="desvanece grid size-8 place-items-center rounded-md text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
                    >
                        <Menu className="size-[1.125rem]" aria-hidden />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" sideOffset={8}>
                        {SECCIONES.map(({ ruta, nombre }) => (
                            <DropdownMenuItem
                                key={ruta}
                                onSelect={() => navigate(ruta)}
                                aria-current={pathname === ruta ? "page" : undefined}
                                className="aria-[current=page]:font-medium"
                            >
                                {nombre}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
