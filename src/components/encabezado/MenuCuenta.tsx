import { useState } from "react"
import { Check, Edit2, Link2, LogOut, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import type { Usuario } from "@/types/dominio"

// Valores de next-themes (contrato con App.tsx), con su nombre en la UI.
export const TEMAS = [
    { valor: "light", nombre: "Claro" },
    { valor: "dark", nombre: "Oscuro" },
    { valor: "negro", nombre: "Negro" },
] as const

interface MenuCuentaProps {
    usuario: Usuario | null
    cargando: boolean
    tema: string | undefined
    onCambiarTema: (tema: string) => void
    onEntrar: () => void
    onCerrarSesion: () => void
    onGuardarNombre: (nombre: string) => void
}

/**
 * Avatar del encabezado y su menú: la cuenta (entrar, guardar el progreso,
 * editar el nombre, cerrar sesión) y el tema. Presentacional: todo llega por props.
 *
 * El anónimo no cierra sesión (perdería lo hecho): entra a su cuenta desde
 * «Guardar mi progreso», que es la misma puerta que «Entrar».
 */
export function MenuCuenta({
    usuario,
    cargando,
    tema,
    onCambiarTema,
    onEntrar,
    onCerrarSesion,
    onGuardarNombre,
}: MenuCuentaProps) {
    const [editandoNombre, establecerEditandoNombre] = useState(false)
    const [nombreNuevo, establecerNombreNuevo] = useState("")

    const abrirEdicion = () => {
        establecerNombreNuevo(usuario?.name ?? "")
        establecerEditandoNombre(true)
    }
    const guardarNombre = () => {
        const limpio = nombreNuevo.trim()
        if (limpio) onGuardarNombre(limpio)
        establecerEditandoNombre(false)
    }

    // Sin sesión todavía (no guardó nada): el avatar vacío lleva a la cuenta
    const anonimo = !usuario || usuario.isAnonymous
    const inicial = usuario && !usuario.isAnonymous ? usuario.name.charAt(0).toUpperCase() : ""

    if (cargando) return <span className="size-8" aria-hidden />

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Tu cuenta"
                >
                    <Avatar className="size-8 border border-border">
                        {usuario?.avatar_url && <AvatarImage src={usuario.avatar_url} alt="" />}
                        <AvatarFallback className="bg-muted text-xs font-semibold">
                            {inicial || <User className="size-4" aria-hidden />}
                        </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" sideOffset={8} className="w-60">
                    {usuario && (
                        <>
                            <DropdownMenuLabel className="font-normal">
                                <span className="block truncate font-medium">{usuario.name}</span>
                                {!usuario.isAnonymous && usuario.email && (
                                    <span className="block truncate text-xs text-muted-foreground">
                                        {usuario.email}
                                    </span>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                        </>
                    )}

                    {!usuario && (
                        <DropdownMenuItem onSelect={onEntrar}>
                            <User aria-hidden />
                            Entrar
                        </DropdownMenuItem>
                    )}
                    {usuario?.isAnonymous && (
                        <>
                            <DropdownMenuItem onSelect={onEntrar} className="text-brand focus:text-brand">
                                <Link2 aria-hidden className="text-brand" />
                                Guardar mi progreso
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={abrirEdicion}>
                                <Edit2 aria-hidden />
                                Editar nombre
                            </DropdownMenuItem>
                        </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                        Tema
                    </DropdownMenuLabel>
                    {TEMAS.map(({ valor, nombre }) => (
                        <DropdownMenuItem
                            key={valor}
                            onSelect={(evento) => {
                                // El menú queda abierto para comparar los temas
                                evento.preventDefault()
                                onCambiarTema(valor)
                            }}
                            aria-checked={tema === valor}
                            role="menuitemradio"
                        >
                            <Check
                                aria-hidden
                                className={tema === valor ? "text-brand" : "invisible"}
                            />
                            {nombre}
                        </DropdownMenuItem>
                    ))}

                    {!anonimo && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={onCerrarSesion}>
                                <LogOut aria-hidden />
                                Cerrar sesión
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={editandoNombre} onOpenChange={establecerEditandoNombre}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Editar nombre</DialogTitle>
                        <DialogDescription>
                            Es el nombre con el que te ven en las salas de estudio.
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={nombreNuevo}
                        onChange={(evento) => establecerNombreNuevo(evento.target.value)}
                        placeholder="Tu apodo"
                        autoFocus
                        onKeyDown={(evento) => evento.key === "Enter" && guardarNombre()}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => establecerEditandoNombre(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={guardarNombre}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
