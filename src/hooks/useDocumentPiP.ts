import { useState, useCallback, useEffect } from 'react';

/**
 * Hook que encapsula la API de "Document Picture-in-Picture" del navegador.
 * Permite abrir una ventana flotante siempre visible, copiándole los estilos y
 * manteniendo sincronizado el tema (modo claro/oscuro) con la pestaña principal.
 */
export function useDocumentPiP() {
    const [esSoportado, establecerEsSoportado] = useState(false);
    const [ventanaPiP, establecerVentanaPiP] = useState<Window | null>(null);

    // Detectamos si el navegador soporta la API al montar
    useEffect(() => {
        establecerEsSoportado('documentPictureInPicture' in window);
    }, []);

    // Abre la ventana flotante con el tamaño indicado y le clona los estilos
    const solicitarPiP = useCallback(async (opciones?: { width?: number; height?: number }) => {
        if (!esSoportado || !window.documentPictureInPicture) {
            console.warn('La API Document Picture-in-Picture no está soportada en este navegador.');
            return null;
        }

        try {
            // Cerramos una ventana PiP previa si ya existía
            if (window.documentPictureInPicture.window) {
                window.documentPictureInPicture.window.close();
            }

            const ventana = await window.documentPictureInPicture.requestWindow({
                width: opciones?.width || 300,
                height: opciones?.height || 200,
            });

            // Copiamos exactamente las hojas de estilo a la ventana nueva
            [...document.styleSheets].forEach((hojaEstilo) => {
                try {
                    const reglasCss = [...hojaEstilo.cssRules].map((regla) => regla.cssText).join('');
                    const estilo = document.createElement('style');
                    estilo.textContent = reglasCss;
                    ventana.document.head.appendChild(estilo);
                } catch (e) {
                    // Si la hoja es de otro origen no podemos leer sus reglas: la enlazamos por href
                    const enlace = document.createElement('link');
                    enlace.rel = 'stylesheet';
                    if (hojaEstilo.href) {
                        enlace.href = hojaEstilo.href;
                        ventana.document.head.appendChild(enlace);
                    }
                }
            });

            // Copiamos las clases del elemento raíz para conservar el tema (ej: dark mode de Tailwind)
            ventana.document.documentElement.className = document.documentElement.className;
            ventana.document.documentElement.style.cssText = document.documentElement.style.cssText;

            // Mantenemos el tema sincronizado mediante un MutationObserver
            const observador = new MutationObserver(() => {
                ventana.document.documentElement.className = document.documentElement.className;
                ventana.document.documentElement.style.cssText = document.documentElement.style.cssText;
            });
            observador.observe(document.documentElement, { attributes: true });

            establecerVentanaPiP(ventana);

            // Escuchamos cuando el usuario cierra la ventana PiP de forma nativa
            ventana.addEventListener('pagehide', () => {
                observador.disconnect();
                establecerVentanaPiP(null);
            });

            return ventana;
        } catch (error) {
            console.error('Falló la apertura de la ventana PiP:', error);
            establecerVentanaPiP(null);
            return null;
        }
    }, [esSoportado]);

    // Cierra la ventana flotante por código (ej: botón "devolver a la pestaña")
    const cerrarPiP = useCallback(() => {
        if (ventanaPiP) {
            ventanaPiP.close();
            establecerVentanaPiP(null);
        }
    }, [ventanaPiP]);

    return { esSoportado, ventanaPiP, solicitarPiP, cerrarPiP };
}
