import { Link, useLocation } from "react-router-dom";
import { Signpost } from "lucide-react";
import { EncabezadoApp } from "@/components/encabezado/EncabezadoApp";
import { EstadoColumna, LineaLink } from "@/components/estados/EstadoColumna";
import { claseBotonAcento } from "@/components/estados/clases";
import { useSalaNueva } from "@/features/home/hooks/useSalaNueva";

/** 404 dentro de HomeLayout: la columna con el encabezado, y el renglón por si era un link de sala. */
export default function NoEncontrada() {
    const { pathname } = useLocation();
    const { unirse } = useSalaNueva();
    return (
        <div className="flex min-h-dvh flex-col">
            <EncabezadoApp />
            <EstadoColumna
                icono={Signpost}
                titulo="Esta página no existe"
                texto={
                    <>
                        <code className="rounded-[0.3125rem] bg-muted px-[0.3125rem] text-[0.88em]">{pathname}</code> no lleva a ningún
                        lado. Puede estar mal escrita o ser de una versión vieja de Doro.
                    </>
                }
            >
                <Link to="/" className={claseBotonAcento}>
                    Ir al inicio
                </Link>
                <LineaLink etiqueta="¿Era un link de sala?" onUnirse={unirse} />
            </EstadoColumna>
        </div>
    );
}
