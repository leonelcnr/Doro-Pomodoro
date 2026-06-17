import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as salasService from "@/features/room/services/salasService";
import { TimerDisplay } from "@/features/timer/components/TimerDisplay";
import { useTareas } from "@/features/tasks/hooks/useTareas";
import { usePresenciaSala } from "@/features/room/hooks/usePresenciaSala";
import { useSincronizacionReloj } from "@/features/timer/hooks/useSincronizacionReloj";
import { CabeceraSala } from "@/features/room/components/CabeceraSala";
import { PanelTareas } from "@/features/room/components/PanelTareas";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/context/AuthContext";

// Los nombres de campos van en inglés porque así están definidos en Supabase
type Invitacion = {
    code: string;
    expires_at: string | null;
    max_uses: number | null;
    uses: number;
    created_at: string;
};

// Una invitación es válida si no expiró y todavía le quedan usos disponibles
function InvitacionValida(inv: Invitacion) {
    const noExpirada = !inv.expires_at || new Date(inv.expires_at).getTime() > Date.now();
    const tieneUsos = inv.max_uses == null || inv.uses < inv.max_uses;
    return noExpirada && tieneUsos;
}


/**
 * Página de una sala de estudio compartida. Es un contenedor delgado: orquesta
 * los hooks de dominio (presencia, tareas, reloj compartido) y compone los
 * subcomponentes (`CabeceraSala`, `TimerDisplay`, `PanelTareas`). Solo conserva
 * la carga de la invitación, que es propia de la página.
 */
const RoomPage = () => {
    // `roomId` proviene del parámetro de la ruta (contrato con el router)
    const { roomId } = useParams();
    const [invitacion, establecerInvitacion] = useState<Invitacion | null>();
    const [cargandoInvitacion, establecerCargandoInvitacion] = useState<boolean>(false);
    const [, establecerError] = useState<string | null>(null);
    const navigate = useNavigate();
    const auth = useAuth();
    const usuario = auth.user;

    // Hooks de dominio: presencia, tareas y sincronización del reloj compartido.
    // La página ya no maneja canales de Supabase ni el estado de tareas a mano.
    const usuariosEnSala = usePresenciaSala(roomId);
    const { tareas, cargado, guardarCambios, moverTarea } = useTareas(roomId);
    useSincronizacionReloj(roomId);

    // Carga la invitación vigente de la sala (lo demás lo resuelven los hooks)
    useEffect(() => {
        if (!roomId || !usuario) return;

        const cargarInvitacion = async () => {
            establecerCargandoInvitacion(true);
            try {
                const invitacionData = await salasService.obtenerInvitacion(roomId);
                establecerCargandoInvitacion(false);
                establecerInvitacion(invitacionData && InvitacionValida(invitacionData) ? invitacionData : null);
            } catch (error: any) {
                establecerCargandoInvitacion(false);
                console.error("Error al inicializar la sala:", error);
                establecerError(error?.message ?? "No se pudo cargar la sala.");
                establecerInvitacion(null);
            }
        };

        cargarInvitacion();
    }, [roomId, usuario]);

    // Arma el enlace de invitación a partir del código vigente
    const enlaceInvitacion = useMemo(() => {
        if (!invitacion?.code) return null;
        return `${window.location.origin}/invitacion/${invitacion.code}`;
    }, [invitacion?.code]);


    return (
        <div className="w-full min-h-dvh py-6 lg:py-24 px-4 bg-background selection:bg-primary/20 overflow-x-hidden">
            <div className="max-w-6xl mx-auto space-y-12 lg:space-y-24 relative mt-16 lg:mt-0">

                <CabeceraSala usuariosEnSala={usuariosEnSala} />

                {cargandoInvitacion ? (
                    <Empty className="w-full h-full flex flex-col items-center justify-center">
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Spinner />
                            </EmptyMedia>
                            <EmptyTitle>Procesando tu invitación...</EmptyTitle>
                            <EmptyDescription>
                                Por favor espera mientras procesamos tu invitación. No recargues la página.
                            </EmptyDescription>
                        </EmptyHeader>
                        <EmptyContent>
                            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                                Cancelar
                            </Button>
                        </EmptyContent>
                    </Empty>
                ) : (
                    <>
                        <div className="flex items-center justify-center border border-dashed rounded-3xl bg-card/10 w-full min-h-80 lg:h-96 py-8 lg:py-0">
                            <TimerDisplay enlace={enlaceInvitacion || ""} codigo={invitacion?.code || ""} salaId={roomId} />
                        </div>

                        <PanelTareas
                            tareas={tareas}
                            cargado={cargado}
                            salaId={roomId}
                            onGuardarCambios={guardarCambios}
                            onMoverTarea={moverTarea}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default RoomPage;
