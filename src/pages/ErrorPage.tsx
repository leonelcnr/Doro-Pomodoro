// src/pages/ErrorPage.tsx
// Pantalla de error global del router (va como `errorElement` de la ruta raíz en
// Routes.tsx). Con react-router en modo data router, los errores de render y los
// fallos de carga de chunks lazy NO llegan a un ErrorBoundary externo: el router
// los captura y renderiza este elemento.
//
// Caso especial — chunk desactualizado: tras un deploy, los hashes de los chunks
// viejos dejan de existir y una pestaña abierta falla al navegar a una ruta lazy.
// Ahí lo correcto es recargar (el HTML nuevo trae los hashes nuevos). Se recarga
// UNA sola vez, con guard en sessionStorage, para no entrar en loop de recargas
// si el problema es otro (p. ej. sin conexión).
//
// Diseño (errores, 4 · Según qué se corta): la columna con «Algo salió mal» y una
// sola acción, sin detalle técnico (va a la consola). En la raíz va sin encabezado
// (lo que se rompió puede ser justamente lo de afuera); como errorElement de
// HomeLayout, con el encabezado y solo en el área de la página.
import { useEffect } from "react";
import { Link, useRouteError } from "react-router-dom";
import { IconInnerShadowTop } from "@tabler/icons-react";
import { CircleAlert } from "lucide-react";
import { EncabezadoApp } from "@/components/encabezado/EncabezadoApp";
import { EstadoColumna } from "@/components/estados/EstadoColumna";
import { claseBotonAcento, claseBotonLink } from "@/components/estados/clases";

const CLAVE_RECARGA = "doro-recarga-por-chunk";
const VENTANA_ANTI_LOOP_MS = 60_000;

// Mensajes que emiten Chrome/Firefox/Safari cuando falla el import dinámico de un chunk.
const REGEX_ERROR_CHUNK =
    /dynamically imported module|Importing a module script failed|Loading chunk .* failed/i;

function esErrorDeChunk(error: unknown): boolean {
    return error instanceof Error && REGEX_ERROR_CHUNK.test(error.message);
}

// true si ya recargamos por chunk hace menos de un minuto (evita el loop).
function yaRecargamosHacePoco(): boolean {
    const marca = Number(sessionStorage.getItem(CLAVE_RECARGA));
    return Number.isFinite(marca) && Date.now() - marca < VENTANA_ANTI_LOOP_MS;
}

export default function ErrorPage({ conEncabezado = false }: { conEncabezado?: boolean }) {
    const error = useRouteError();
    const debeRecargar = esErrorDeChunk(error) && !yaRecargamosHacePoco();

    useEffect(() => {
        if (debeRecargar) {
            sessionStorage.setItem(CLAVE_RECARGA, String(Date.now()));
            window.location.reload();
        } else {
            // Queda a la vista en la consola para diagnóstico (no hay Sentry aún).
            console.error("Error capturado por ErrorPage:", error);
        }
    }, [debeRecargar, error]);

    // Evita el flash de la pantalla de error mientras el navegador recarga.
    if (debeRecargar) return null;

    return (
        <div className="flex min-h-dvh flex-col bg-background">
            {conEncabezado ? (
                <EncabezadoApp />
            ) : (
                <header className="flex h-14 shrink-0 items-center px-5 md:px-8">
                    <a href="/" aria-label="Doro, inicio" className="inline-flex items-center gap-2 font-semibold tracking-tight">
                        <IconInnerShadowTop className="size-[1.375rem] text-brand" aria-hidden />
                        Doro
                    </a>
                </header>
            )}
            <EstadoColumna icono={CircleAlert} titulo="Algo salió mal" texto="Recargá y seguí: lo que guardaste no se pierde.">
                <button type="button" onClick={() => window.location.reload()} className={claseBotonAcento}>
                    Recargar
                </button>
                <Link to="/" reloadDocument className={`text-[0.9375rem] ${claseBotonLink}`}>
                    Ir al inicio
                </Link>
            </EstadoColumna>
        </div>
    );
}
