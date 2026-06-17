import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import supabase from "@/lib/supabase"
import { parsearInvitacion } from "@/features/home/parsearInvitacion"
import DialogCargando from "@/features/home/components/DialogCargando"


// Diálogo para unirse a una sala existente ingresando su código o enlace de invitación
const DialogUnirse = () => {
    const [valor, establecerValor] = useState("");
    const [mensajeError, establecerMensajeError] = useState<string | null>(null);
    const [cargando, establecerCargando] = useState(false);
    const navigate = useNavigate();

    // Valida el código ingresado y llama a la RPC `join_room` para entrar a la sala
    const unirse = async (valorActual?: string) => {


        establecerMensajeError(null);
        const codigoAParsear = valorActual !== undefined ? valorActual : valor;
        const codigo = parsearInvitacion(codigoAParsear);
        if (!codigo) {
            establecerMensajeError("Pegá un código válido o un link de invitación.");
            return;
        }

        establecerCargando(true);
        const { data: salaId, error } = await supabase.rpc("join_room", { p_code: codigo });
        establecerCargando(false);

        if (error) {
            establecerMensajeError(error.message || "No se pudo unir.");
            return;
        }
        navigate(`/room/${salaId}`);
    };


    // Mientras se procesa el ingreso, mostramos el estado de carga
    if (cargando) {
        return (
            <Dialog>
                <DialogTrigger asChild><Button variant="outline" className="w-full h-10">Unirse</Button></DialogTrigger>
                <DialogContent className="flex flex-col gap-6">
                    <DialogHeader>
                        <DialogTitle>Unirse a la sala</DialogTitle>
                    </DialogHeader>
                    <DialogCargando />
                </DialogContent>
            </Dialog>
        )
    }
    return (
        <Dialog>
            <DialogTrigger asChild><Button variant="outline" className="w-full h-10">Unirse</Button></DialogTrigger>
            <DialogContent className="flex flex-col gap-6">
                <DialogHeader>
                    <DialogTitle>Unirse a la sala</DialogTitle>
                    <DialogDescription>
                        Introduce el código de la sala
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    unirse();
                }}>
                    <div>
                        <Input
                            placeholder="Código"
                            value={valor}
                            onChange={(e) => establecerValor(e.target.value)}
                        />
                    </div>
                    {mensajeError && <p className="text-destructive text-sm mt-2">{mensajeError}</p>}
                    <DialogFooter className="sm:justify-start mt-6">
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Cancelar</Button>
                        </DialogClose>
                        <Button type="submit">Unirse</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export default DialogUnirse
