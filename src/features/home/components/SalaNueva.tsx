import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parsearInvitacion } from "@/features/home/parsearInvitacion"
import { useNavigate } from 'react-router-dom';
import supabase from "@/lib/supabase"
import { toast } from "sonner"


// Tarjeta con dos acciones: crear una sala nueva o unirse a una existente por código
export const SalaNueva = () => {
    const navigate = useNavigate();

    // CREAR SALA NUEVA: invoca la RPC `create_room` y navega a la sala recién creada
    const crearSala = async () => {
        const { data, error } = await supabase.rpc("create_room", {
            p_name: "Sala de estudio",
            p_is_public: false,
            p_max_uses: null,
            p_expires_minutes: null,
        });
        if (error) return;

        // `room_id` es la columna devuelta por la RPC (se mantiene en inglés)
        const { room_id } = data[0];
        console.log(room_id);
        navigate(`/room/${room_id}`);
    };


    // UNIRSE A SALA
    const [codigoSala, establecerCodigoSala] = useState('');

    // Valida el código y entra a la sala mediante la RPC `join_room`
    const unirse = async () => {

        const codigo = parsearInvitacion(codigoSala);

        const { data: salaId, error } = await supabase.rpc("join_room", { p_code: codigo });

        if (error) {
            console.log(error.message);
            toast.error(error.message || "No se pudo unir.");
            return;
        }
        navigate(`/room/${salaId}`);
    };


    return (

        // 'w-full' asegura que ocupe todo el espacio a los lados
        // Usamos colores oscuros de la paleta zinc que coinciden con el diseño original
        <div className="w-full bg-transparent border-none overflow-hidden">
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">

                {/* SECCIÓN IZQUIERDA: CREAR SALA */}
                <div className="flex-1 py-6 md:py-8 md:pr-8 flex flex-col justify-start">
                    <div className="mb-2 flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-wide">Nueva Sala</h2>
                    </div>
                    <p className=" text-sm mb-6 grow text-muted-foreground">
                        Crea una sala para iniciar una sesión de Pomodoro y obtén un enlace para compartir con tus amigos.
                    </p>
                    <Button
                        onClick={crearSala}
                        className="w-full text-white py-6 text-md transition-all duration-200 active:scale-[0.98]">
                        Crear
                    </Button>
                </div>

                {/* SECCIÓN DERECHA: UNIRSE A SALA */}
                <div className="flex-1 py-6 md:py-8 md:pl-8 flex flex-col justify-start">
                    <div className="mb-2 flex items-center gap-2">
                        <h2 className="text-xl font-bold  tracking-wide">Unirse a sala</h2>
                    </div>
                    <p className=" text-sm mb-6 grow">
                        ¿Ya tienes una invitación? Introduce el código de la sala para unirte a una sesión existente.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Input
                            type="text"
                            placeholder="Código de sala (Ej: 0852EF11)"
                            value={codigoSala}
                            onChange={(e) => establecerCodigoSala(e.target.value)}
                            className="h-12 grow"
                        />

                        <Button
                            disabled={!codigoSala}
                            variant="outline"
                            className="h-12 transition-colors disabled:opacity-50 sm:w-1/3"
                            onClick={unirse}
                        >
                            Unirse
                        </Button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SalaNueva;
