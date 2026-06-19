import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import supabase from "@/lib/supabase";
import * as salasService from "@/features/room/services/salasService";
import { Button } from "@/components/ui/button"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"

/**
 * Página intermedia al abrir un enlace de invitación (/invitacion/:code).
 * Procesa automáticamente el código: valida la sesión (redirige a login si hace
 * falta), se une a la sala vía la RPC `join_room` y navega a ella.
 */
const Invitacion = () => {
    // `code` viene del parámetro de la ruta (contrato con el router)
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const [mensajeError, establecerMensajeError] = useState<string | null>(null);

    useEffect(() => {
        const procesarInvitacion = async () => {
            const codigoInvitacion = (code ?? "").trim().toUpperCase();
            if (!codigoInvitacion) {
                establecerMensajeError("Código inválido.");
                return;
            }

            // 1) Verificamos la sesión (si no hay login, vamos a login y luego volvemos acá)
            const { data: { session: sesion } } = await supabase.auth.getSession();
            if (!sesion) {
                const redireccion = encodeURIComponent(`/invitacion/${codigoInvitacion}`);
                navigate(`/login?redirect=${redireccion}`, { replace: true, state: { from: location.pathname } });
                return;
            }

            // 2) Nos unimos a la sala mediante el servicio de salas
            try {
                const salaId = await salasService.unirseASala(codigoInvitacion);
                // 3) Entramos a la sala
                navigate(`/room/${salaId}`, { replace: true });
            } catch (error: unknown) {
                const mensaje = error instanceof Error ? error.message : undefined;
                establecerMensajeError(mensaje || "No se pudo unir a la sala.");
            }
        };

        procesarInvitacion();
    }, [code, navigate]);

    if (mensajeError) {
        return (
            <Empty className="w-full h-screen flex flex-col items-center justify-center">
                <EmptyHeader>
                    <EmptyTitle>Error</EmptyTitle>
                    <EmptyDescription>
                        {mensajeError}
                    </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                    <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                        Volver al inicio
                    </Button>
                </EmptyContent>
            </Empty>
        );
    }

    return (
        <Empty className="w-full h-screen flex flex-col items-center justify-center">
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
    );
}

export default Invitacion;
