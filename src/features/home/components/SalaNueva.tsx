import { useState } from 'react';
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

    // Evita que un doble click cree dos salas: la petición tarda y el botón
    // quedaba habilitado mientras tanto.
    const [creando, establecerCreando] = useState(false);

    // CREAR SALA NUEVA: crea la sala vía el servicio y navega a la recién creada
    const crearSala = async () => {
        if (creando) return;
        establecerCreando(true);
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
            // Solo se rehabilita si falló: en el camino feliz ya se navegó fuera.
            establecerCreando(false);
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
        // Dos destinos, con pesos distintos: crear una sala es el camino principal y
        // ocupa el doble; unirse solo aplica si alguien ya te pasó un código, y la
        // mayoría llega por link de invitación (ver `InvitacionPage`) sin tipear nada.
        // El reflujo va por container query porque la sidebar cambia el ancho útil.
        <div className="grid w-full gap-4 @xl/main:grid-cols-[2fr_1fr]">

            {/* CREAR SALA: la acción primaria */}
            <Card className="gap-0 p-6">
                <h2 className="mb-2 text-lg font-bold tracking-tight">Nueva sala</h2>
                <p className="mb-6 grow text-sm text-muted-foreground">
                    Iniciá una sesión de Pomodoro y compartí el enlace con quien quieras estudiar.
                </p>
                <Button
                    onClick={crearSala}
                    disabled={creando}
                    className="w-full py-6 text-md transition-all duration-200 active:scale-[0.98]">
                    {creando ? "Creando sala…" : "Crear sala"}
                </Button>
            </Card>

            {/* UNIRSE: la acción condicional, en un tercio del ancho */}
            <Card className="gap-0 p-6">
                <h2 className="mb-2 text-lg font-bold tracking-tight">Unirse</h2>
                <p className="mb-6 grow text-sm text-muted-foreground">
                    Con el código que te pasaron.
                </p>
                <form onSubmit={unirse} className="flex flex-col gap-3">
                    <Input
                        type="text"
                        placeholder="0852EF11"
                        value={codigoSala}
                        onChange={(e) => establecerCodigoSala(e.target.value)}
                        aria-label="Código de sala"
                        className="h-12"
                    />
                    <Button
                        type="submit"
                        disabled={!codigoSala}
                        variant="outline"
                        className="h-12 transition-colors disabled:opacity-50"
                    >
                        Unirse
                    </Button>
                </form>
            </Card>

        </div>
    );
};

export default SalaNueva;
