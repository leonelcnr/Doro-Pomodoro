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
import { useEffect } from "react";
import { Link, useRouteError } from "react-router-dom";
import { Button } from "@/components/ui/button";

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

export default function ErrorPage() {
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

    const detalle = error instanceof Error ? error.message : undefined;

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
            <h1 className="text-2xl font-semibold text-foreground">Algo salió mal</h1>
            <p className="text-muted-foreground max-w-md">
                Ocurrió un error inesperado. Podés recargar la página o volver al inicio;
                tu sesión y tus datos no se pierden.
            </p>
            {detalle && (
                <p className="text-xs text-muted-foreground/70 max-w-md break-words font-mono">
                    {detalle}
                </p>
            )}
            <div className="flex gap-3">
                <Button onClick={() => window.location.reload()}>Recargar</Button>
                <Button variant="outline" asChild>
                    <Link to="/">Volver al inicio</Link>
                </Button>
            </div>
        </div>
    );
}
