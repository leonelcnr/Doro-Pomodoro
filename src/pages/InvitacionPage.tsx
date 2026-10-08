import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Unlink } from "lucide-react";
import * as salasService from "@/features/room/services/salasService";
import { useSalaNueva } from "@/features/home/hooks/useSalaNueva";
import { EncabezadoApp } from "@/components/encabezado/EncabezadoApp";
import { CargaArco, EstadoColumna, LineaLink } from "@/components/estados/EstadoColumna";
import { claseBotonLink } from "@/components/estados/clases";

/**
 * Link de invitación (/invitacion/:code), «1 · Directo»: si ya te pasaron el link es
 * porque querés entrar, así que te une sola (sin sesión, entra como anónimo) y te
 * lleva a la sala. Mientras, gira el arco del anillo; si el link no sirve, la columna
 * de errores con el renglón para pegar otro.
 */
const Invitacion = () => {
    // `code` viene del parámetro de la ruta (contrato con el router)
    const { code } = useParams<{ code: string }>();
    const navigate = useNavigate();
    const { unirse } = useSalaNueva();
    const [fallo, establecerFallo] = useState(false);

    useEffect(() => {
        const codigo = (code ?? "").trim().toUpperCase();
        if (!codigo) {
            establecerFallo(true);
            return;
        }
        salasService
            .unirseASala(codigo)
            .then((salaId) => navigate(`/room/${salaId}`, { replace: true }))
            .catch((error: unknown) => {
                // El detalle va a la consola; en pantalla, la columna sin mensaje técnico
                console.error("No se pudo entrar con la invitación:", error);
                establecerFallo(true);
            });
    }, [code, navigate]);

    return (
        <div className="flex min-h-dvh flex-col">
            <EncabezadoApp />
            {fallo ? (
                // ponytail: join_room no distingue «venció» de «no existe»; sin vencimiento de links, «no existe» es el caso real
                <EstadoColumna
                    icono={Unlink}
                    titulo="No encontramos esta sala"
                    texto="Puede que el link esté mal copiado o que la sala se haya cerrado."
                >
                    <LineaLink etiqueta="¿Tenés otro?" onUnirse={unirse} />
                    <Link to="/" className={`mt-2 text-[0.9375rem] ${claseBotonLink}`}>
                        Ir a Doro
                    </Link>
                </EstadoColumna>
            ) : (
                <CargaArco texto="Entrando a la sala…" />
            )}
        </div>
    );
};

export default Invitacion;
