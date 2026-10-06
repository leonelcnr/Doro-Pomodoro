import { useState } from "react"
import {
  IconDotsVertical,
  IconLogout,
} from "@tabler/icons-react"
import { User, Edit2, Link2 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/context/useAuth"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
    isAnonymous?: boolean
  }
}) {
  const { isMobile } = useSidebar()
  const auth = useAuth()
  
  const [isEditNameOpen, setIsEditNameOpen] = useState(false)
  const [newName, setNewName] = useState(user.name)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // La cuenta se elige en /login, que después vuelve a esta misma página
  const irALogin = () =>
    navigate(pathname === "/" ? "/login" : `/login?redirect=${encodeURIComponent(pathname)}`)

  const handleSaveName = () => {
    if (newName && newName.trim().length > 0) {
      localStorage.setItem('anon_name', newName.trim());
      // Refrescar para ver los cambios localmente en toda la app
      window.location.reload(); 
    }
    setIsEditNameOpen(false);
  }

  // Sin sesión todavía (no guardó nada): solo la puerta a la cuenta
  if (!auth.user) {
    if (auth.cargando) return null
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" onClick={irALogin}>
            <User className="size-4" />
            <span className="font-medium">Entrar</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  const inicial = user.name.charAt(0).toUpperCase() || "D"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.isAnonymous ? <User className="size-4" /> : inicial}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                {!user.isAnonymous && user.email && (
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                )}
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.isAnonymous ? <User className="size-4" /> : inicial}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  {!user.isAnonymous && user.email && (
                    <span className="text-muted-foreground truncate text-xs">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {user.isAnonymous && (
              <>
                <DropdownMenuItem onSelect={irALogin} className="bg-primary/10 text-primary cursor-pointer my-1">
                  <Link2 className="mr-2 h-4 w-4" />
                  Guardar mi progreso
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsEditNameOpen(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar nombre
                </DropdownMenuItem>
              </>
            )}

            {/* El anónimo no cierra sesión (perdería lo hecho): entra a su cuenta
                desde «Guardar mi progreso», que es la misma puerta */}
            {!user.isAnonymous && (
              <DropdownMenuItem onSelect={auth.signOut}>
                <IconLogout className="mr-2 h-4 w-4" />
                Cerrar sesión
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isEditNameOpen} onOpenChange={setIsEditNameOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar nombre</DialogTitle>
              <DialogDescription>
                Cambia el nombre con el que otros te verán en las salas de estudio.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ingresa tu apodo..."
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditNameOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveName}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </SidebarMenuItem>
    </SidebarMenu>
  )
}
