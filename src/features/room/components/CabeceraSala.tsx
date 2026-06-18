import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AvataresUsuarios } from "./AvataresUsuarios";
import type { UsuarioEnSala } from "@/types/dominio";

/**
 * Cabecera de la sala: botón "Salir" (con confirmación) a la izquierda y los
 * avatares de los usuarios conectados a la derecha.
 */
export function CabeceraSala({ usuariosEnSala }: { usuariosEnSala: UsuarioEnSala[] }) {
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-between lg:absolute lg:-top-16 lg:left-0 lg:right-0 mb-8 lg:mb-0 w-full animate-in fade-in duration-700">
            <div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Salir
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="sm:max-w-[425px]">
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Salir de la sala?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Volverás al inicio.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Mantenerse</AlertDialogCancel>
                            <AlertDialogAction onClick={() => navigate("/")}>
                                Salir de la sala
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <AvataresUsuarios usuarios={usuariosEnSala} />
        </div>
    );
}
