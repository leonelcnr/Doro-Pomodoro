import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMusicaSala } from "@/features/room/hooks/useMusicaSala";
import { useAudioAmbiente } from "@/features/room/hooks/useAudioAmbiente";
import { AMBIENT_SOUNDS } from "./music/ambientSounds";
import { ReproductorAudioSinCortes } from "./music/ReproductorAudioSinCortes";
import { MezcladorAmbiente } from "./music/MezcladorAmbiente";
import { ReproductorLocal } from "./music/ReproductorLocal";
import { ReproductorSala } from "./music/ReproductorSala";
import { parsearUrlMedia, parsearYoutube } from "./music/parsearUrlMedia";

/**
 * Panel del reproductor de música con tres pestañas:
 *  - Ambiental: mezcla de sonidos de fondo con volumen independiente.
 *  - Local: incrusta un video/track de YouTube o Spotify solo para este usuario.
 *  - Sala: comparte un video de YouTube sincronizado con todos (vía `music_state`).
 *
 * Es un contenedor delgado: conecta los hooks (`useAudioAmbiente`, `useMusicaSala`)
 * con las piezas presentacionales y mantiene los motores de audio ambiental
 * montados de forma persistente (fuera de las pestañas, que se desmontan).
 */
export const MusicPlayer = React.memo(function MusicPlayer({ salaId }: { salaId?: string }) {
    const [estaAbierto, establecerEstaAbierto] = useState(false);
    const refDesplegable = useRef<HTMLDivElement>(null);

    // Estado del modo Ambiental (hook: mezclador de sonidos locales, sin Supabase)
    const {
        volumenes: volumenesAmbiente,
        activo: ambienteActivo,
        establecerActivo: establecerAmbienteActivo,
        establecerVolumen: establecerVolumenAmbiente,
        hayAmbienteActivo,
    } = useAudioAmbiente();

    // Estado del modo Local (solo para este usuario). Vive en el contenedor para
    // que persista al cambiar de pestaña (las TabsContent se desmontan).
    const [entradaUrlLocal, establecerEntradaUrlLocal] = useState("");
    const [urlIncrustadaLocal, establecerUrlIncrustadaLocal] = useState<string | null>(null);
    const [errorLocal, establecerErrorLocal] = useState<string | null>(null);

    // Estado del modo Sala (sincronizado entre usuarios vía hook + Supabase)
    const [entradaUrlSala, establecerEntradaUrlSala] = useState("");
    const { estadoSala, actualizarEstadoSala } = useMusicaSala(salaId);
    const [errorSala, establecerErrorSala] = useState<string | null>(null);

    // Detecta clics fuera del panel para cerrarlo
    useEffect(() => {
        const manejarClickFuera = (evento: MouseEvent) => {
            if (refDesplegable.current && !refDesplegable.current.contains(evento.target as Node)) {
                establecerEstaAbierto(false);
            }
        };
        if (estaAbierto) document.addEventListener("mousedown", manejarClickFuera);
        return () => document.removeEventListener("mousedown", manejarClickFuera);
    }, [estaAbierto]);

    // Carga un enlace de YouTube/Spotify en el reproductor local (solo este usuario)
    const manejarCargarLocal = (e: React.FormEvent) => {
        e.preventDefault();
        establecerErrorLocal(null);
        if (!entradaUrlLocal.trim()) { establecerUrlIncrustadaLocal(null); return; }

        const urlEmbebida = parsearUrlMedia(entradaUrlLocal);
        if (urlEmbebida) {
            establecerUrlIncrustadaLocal(urlEmbebida);
            return;
        }

        establecerErrorLocal("URL inválida. Usa YouTube o Spotify.");
    };

    // Carga un enlace de YouTube para la sala sincronizada (todos lo ven)
    const manejarCargarSala = (e: React.FormEvent) => {
        e.preventDefault();
        establecerErrorSala(null);
        if (!entradaUrlSala.trim()) return;

        const urlEmbebida = parsearYoutube(entradaUrlSala);
        if (urlEmbebida) {
            actualizarEstadoSala({ url: urlEmbebida, isPlaying: true });
            establecerEntradaUrlSala("");
        } else {
            establecerErrorSala("Para la sala sincronizada, usa solo enlaces de YouTube.");
        }
    };

    // Indica si hay alguna fuente de audio activa (para resaltar el botón del reproductor)
    const musicaActiva = urlIncrustadaLocal || estadoSala.url || hayAmbienteActivo;

    return (
        <div className="relative flex items-center" ref={refDesplegable}>
            {/* Motores de audio ambiental: se mantienen montados siempre (fuera del
                modal y de las pestañas) para que el sonido no se corte al cambiar de
                pestaña o cerrar el panel. No renderizan nada. */}
            {AMBIENT_SOUNDS.map(sonido => (
                <ReproductorAudioSinCortes
                    key={sonido.id}
                    fuente={sonido.archivo}
                    volumenObjetivo={volumenesAmbiente[sonido.id] || 0}
                    reproduciendo={ambienteActivo}
                />
            ))}

            <Button
                variant={estaAbierto || musicaActiva ? "default" : "outline"}
                size="icon"
                onClick={() => establecerEstaAbierto(!estaAbierto)}
                className={`h-10 w-10 transition-all ${musicaActiva && !estaAbierto ? 'bg-primary text-primary-foreground shadow-sm animate-pulse' : 'text-muted-foreground hover:text-foreground shadow-sm bg-background border-border/50'}`}
                title="Música de Fondo"
            >
                <Music className="w-5 h-5" />
            </Button>

            {/* Modal flotante */}
            <div
                className={`fixed z-50 bottom-24 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 w-[340px] sm:w-[400px] bg-popover text-popover-foreground border shadow-2xl rounded-xl p-5 transition-all duration-300 flex flex-col gap-4 ${estaAbierto ? 'opacity-100 pointer-events-auto translate-y-0 scale-100 visible' : 'opacity-0 pointer-events-none translate-y-4 scale-95 invisible'}`}
            >
                <div className="flex flex-col gap-1">
                    <h4 className="font-semibold leading-none tracking-tight">Reproductor</h4>
                    <p className="text-sm text-muted-foreground leading-tight">Configura tu ambiente ideal de concentración.</p>
                </div>

                <Tabs defaultValue="ambient" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="ambient">Ambiental</TabsTrigger>
                        <TabsTrigger value="local">Local</TabsTrigger>
                        <TabsTrigger value="room" disabled={!salaId}>Sala</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ambient">
                        <MezcladorAmbiente
                            volumenes={volumenesAmbiente}
                            activo={ambienteActivo}
                            onToggleActivo={establecerAmbienteActivo}
                            onCambiarVolumen={establecerVolumenAmbiente}
                        />
                    </TabsContent>

                    <TabsContent value="local">
                        <ReproductorLocal
                            entrada={entradaUrlLocal}
                            onEntradaChange={establecerEntradaUrlLocal}
                            urlIncrustada={urlIncrustadaLocal}
                            error={errorLocal}
                            onSubmit={manejarCargarLocal}
                            onLimpiar={() => establecerUrlIncrustadaLocal(null)}
                        />
                    </TabsContent>

                    <TabsContent value="room">
                        <ReproductorSala
                            entrada={entradaUrlSala}
                            onEntradaChange={establecerEntradaUrlSala}
                            error={errorSala}
                            onSubmit={manejarCargarSala}
                            estadoSala={estadoSala}
                            onLimpiar={() => actualizarEstadoSala({ url: "", isPlaying: false })}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
});
