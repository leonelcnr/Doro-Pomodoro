import { Avatar, AvatarFallback, AvatarGroup, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Indicador presentacional de los usuarios conectados a la sala: muestra el
 * conteo ("En sala / N personas") y un grupo de avatares con tooltip de nombre.
 *
 * Recibe la lista por props (la calcula el hook `usePresenciaSala`); no sabe de
 * Supabase ni de presencia.
 */
export function AvataresUsuarios({ usuarios }: { usuarios: any[] }) {
    return (
        <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-sm text-muted-foreground hidden sm:flex flex-col items-end">
                <span className="font-medium text-foreground">En sala</span>
                <span className="text-xs">{usuarios.length} {usuarios.length === 1 ? 'persona' : 'personas'}</span>
            </div>
            <AvatarGroup>
                <TooltipProvider delayDuration={100}>
                    {usuarios.map((user) => (
                        <Tooltip key={user.id}>
                            <TooltipTrigger asChild>
                                <div className="relative cursor-help">
                                    <Avatar size="sm" className="ring-2 ring-background hover:ring-primary/50 transition-all">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback className="text-xs">{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="z-50 text-xs font-medium">
                                <p>{user.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </AvatarGroup>
        </div>
    );
}
