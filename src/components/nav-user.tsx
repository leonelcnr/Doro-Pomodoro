import { useState } from "react"
import {
  IconDotsVertical,
  IconLogout,
} from "@tabler/icons-react"
import { User, Edit2, LogIn, Link2 } from "lucide-react"

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
  const [isLinkAccountOpen, setIsLinkAccountOpen] = useState(false)

  const handleSaveName = () => {
    if (newName && newName.trim().length > 0) {
      localStorage.setItem('anon_name', newName.trim());
      // Refrescar para ver los cambios localmente en toda la app
      window.location.reload(); 
    }
    setIsEditNameOpen(false);
  }

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
                  {user.isAnonymous ? <User className="size-4" /> : "CN"}
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
                    {user.isAnonymous ? <User className="size-4" /> : "CN"}
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
                <DropdownMenuItem onSelect={() => setIsLinkAccountOpen(true)} className="bg-primary/10 text-primary cursor-pointer my-1">
                  <Link2 className="mr-2 h-4 w-4" />
                  Vincular cuenta (Guardar progreso)
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setIsEditNameOpen(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editar nombre
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem onSelect={auth.signOut} className={user.isAnonymous ? "text-primary focus:text-primary" : ""}>
              {user.isAnonymous ? <LogIn className="mr-2 h-4 w-4" /> : <IconLogout className="mr-2 h-4 w-4" />}
              {user.isAnonymous ? "Iniciar sesión" : "Cerrar sesión"}
            </DropdownMenuItem>
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

        <Dialog open={isLinkAccountOpen} onOpenChange={setIsLinkAccountOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Guardar tu progreso</DialogTitle>
              <DialogDescription>
                Vincula tu cuenta anónima a un proveedor para no perder tus estadísticas ni tareas. Seguirás teniendo tus datos intactos.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button variant="outline" className="w-full relative h-11" onClick={() => auth.linkAccount('google')}>
                <svg className="absolute left-4 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" fill="currentColor" />
                </svg>
                Vincular con Google
              </Button>
              <Button variant="outline" className="w-full relative h-11" onClick={() => auth.linkAccount('github')}>
                <svg className="absolute left-4 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" fill="currentColor" />
                </svg>
                Vincular con Github
              </Button>
              <Button variant="outline" className="w-full relative h-11" onClick={() => auth.linkAccount('discord')}>
                <svg className="absolute left-4 size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36">
                  <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.08 0 72.37 72.37 0 0 0-3.36-6.83 105.15 105.15 0 0 0-26.23 8.07C2.04 33.12-2.3 57.54.91 81.54a105.21 105.21 0 0 0 32.18 14.82 72.4 72.4 0 0 0 6.91-10.87 68.32 68.32 0 0 1-10.86-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.31 68.31 0 0 1-10.87 5.19 72.4 72.4 0 0 0 6.91 10.86 105.02 105.02 0 0 0 32.18-14.82c3.55-27.4-3.14-50.41-19.34-73.47ZM42.68 65.88c-6.13 0-11.23-5.26-11.23-11.7s4.98-11.7 11.23-11.7c6.32 0 11.38 5.33 11.23 11.7 0 6.44-4.99 11.7-11.23 11.7Zm41.78 0c-6.13 0-11.23-5.26-11.23-11.7s4.98-11.7 11.23-11.7c6.32 0 11.38 5.33 11.23 11.7 0 6.44-4.99 11.7-11.23 11.7Z" fill="currentColor" />
                </svg>
                Vincular con Discord
              </Button>
            </div>
            <DialogFooter className="sm:justify-start">
              <Button type="button" variant="ghost" onClick={() => setIsLinkAccountOpen(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
