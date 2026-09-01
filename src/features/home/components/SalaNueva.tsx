import { useState } from 'react';
import { Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { parsearInvitacion } from "@/features/home/parsearInvitacion"
import { useNavigate } from 'react-router-dom';
import * as salasService from "@/features/room/services/salasService"
import { useTimerStore } from "@/store/timerStore"
import type { EstadoReloj } from "@/types/dominio"
import { toast } from "sonner"


// Tarjeta con dos acciones: crear una sala nueva o unirse a una existente por código
export const SalaNueva = () => {
    const navigate = useNavigate();

    // Configuración local de quien crea la sala: la sala nueva nace con SUS
    // duraciones en vez de un valor fijo.
    const configuracion = useTimerStore((estado) => estado.configuracion);

    // CREAR SALA NUEVA: crea la sala vía el servicio y navega a la recién creada
    const crearSala = async () => {
        // Estado inicial del reloj compartido. Sin sembrarlo, la fila queda con el
        // default de la columna (que no cumple el contrato `EstadoReloj`) y la sala
        // arranca en 00:00.
        const estadoInicial: EstadoReloj = {
            modo: "pomodoro",
            tiempoRestante: configuracion.pomodoro * 60,
            estaActivo: false,
            configuracion,
            actualizadoEn: new Date().toISOString(),
        };

        try {
            const salaId = await salasService.crearSala(estadoInicial);
            navigate(`/room/${salaId}`);
        } catch (error) {
            console.error(error);
            toast.error("No se pudo crear la sala.");
        }
    };


    // UNIRSE A SALA
    const [codigoSala, establecerCodigoSala] = useState('');

    // Valida el código y entra a la sala mediante el servicio de salas
    const unirse = async (e: React.FormEvent) => {
        e.preventDefault();
        const codigo = parsearInvitacion(codigoSala);

        try {
            const salaId = await salasService.unirseASala(codigo);
            navigate(`/room/${salaId}`);
        } catch (error: unknown) {
            const mensaje = error instanceof Error ? error.message : undefined;
            console.log(mensaje);
            toast.error(mensaje || "No se pudo unir.");
        }
    };


    return (
        // Dos destinos claros: crear una sala nueva o unirse a una existente.
        <div className="grid w-full gap-4 md:grid-cols-2">

            {/* TARJETA IZQUIERDA: CREAR SALA */}
            <Card className="gap-0 p-6">
                <div className="mb-2 flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                        <Plus className="size-5" />
                    </span>
                    <h2 className="text-lg font-bold tracking-tight">Nueva sala</h2>
                </div>
                <p className="mb-6 grow text-sm text-muted-foreground">
                    Iniciá una sesión de Pomodoro y obtené un enlace para compartir con tus amigos.
                </p>
                <Button
                    onClick={crearSala}
                    className="w-full py-6 text-md transition-all duration-200 active:scale-[0.98]">
                    Crear sala
                </Button>
            </Card>

            {/* TARJETA DERECHA: UNIRSE A SALA */}
            <Card className="gap-0 p-6">
                <div className="mb-2 flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                        <ArrowRight className="size-5" />
                    </span>
                    <h2 className="text-lg font-bold tracking-tight">Unirse a sala</h2>
                </div>
                <p className="mb-6 grow text-sm text-muted-foreground">
                    ¿Ya tenés una invitación? Introducí el código de la sala para unirte a una sesión existente.
                </p>
                <form onSubmit={unirse} className="flex flex-col gap-3 sm:flex-row">
                    <Input
                        type="text"
                        placeholder="Código de sala (Ej: 0852EF11)"
                        value={codigoSala}
                        onChange={(e) => establecerCodigoSala(e.target.value)}
                        className="h-12 grow"
                    />
                    <Button
                        type="submit"
                        disabled={!codigoSala}
                        variant="outline"
                        className="h-12 transition-colors disabled:opacity-50 sm:w-1/3"
                    >
                        Unirse
                    </Button>
                </form>
            </Card>

        </div>
    );
};

export default SalaNueva;
