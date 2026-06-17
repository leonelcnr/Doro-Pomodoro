import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, X, Play, Radio, CloudRain, Flame, Waves, CloudLightning, Users, Car, Train, Keyboard, Bird, Activity, Droplets } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import supabase from '@/lib/supabase';

// Catálogo de sonidos ambientales. Los `id` y las rutas `archivo` deben coincidir
// con los archivos reales en /public/sounds, por eso se mantienen en inglés.
const AMBIENT_SOUNDS = [
    { id: "rain", nombre: "Lluvia", icono: CloudRain, archivo: "/sounds/rain.ogg" },
    { id: "fire", nombre: "Fogata", icono: Flame, archivo: "/sounds/fire.ogg" },
    { id: "ocean", nombre: "Océano", icono: Waves, archivo: "/sounds/ocean.ogg" },
    { id: "thunder", nombre: "Truenos", icono: CloudLightning, archivo: "/sounds/thunder.ogg" },
    { id: "people", nombre: "Personas", icono: Users, archivo: "/sounds/people.ogg" },
    { id: "traffic", nombre: "Tráfico", icono: Car, archivo: "/sounds/traffic.ogg" },
    { id: "train", nombre: "Tren", icono: Train, archivo: "/sounds/train.ogg" },
    { id: "keyboard", nombre: "Teclado", icono: Keyboard, archivo: "/sounds/keyboard.ogg" },
    { id: "birds", nombre: "Pájaros", icono: Bird, archivo: "/sounds/birds.ogg" },
    { id: "brown_noise", nombre: "Ruido Marrón", icono: Activity, archivo: "/sounds/brown_noise.ogg" },
    { id: "jazz", nombre: "Jazz", icono: Music, archivo: "/sounds/jazz.ogg" },
    { id: "underwater", nombre: "Subacuático", icono: Droplets, archivo: "/sounds/white-noise-underwater.ogg" },
];

/**
 * Reproductor de audio en bucle sin cortes (gapless). Usa dos elementos <audio>
 * en "ping-pong" y hace un crossfade de potencia constante entre el final de una
 * vuelta y el inicio de la siguiente, evitando el silencio del corte del loop.
 * No renderiza nada (solo controla audio), de ahí que devuelva null.
 */
const ReproductorAudioSinCortes = ({ fuente, volumenObjetivo, reproduciendo }: { fuente: string, volumenObjetivo: number, reproduciendo: boolean }) => {
    const audioA = useRef<HTMLAudioElement | null>(null);
    const audioB = useRef<HTMLAudioElement | null>(null);
    const audioActivo = useRef<'A' | 'B'>('A');
    const refSolicitud = useRef<number>(null);

    // Configuración inicial de los audios (buffers ping-pong)
    useEffect(() => {
        audioA.current = new Audio(fuente);
        audioB.current = new Audio(fuente);
        audioA.current.preload = "auto";
        audioB.current.preload = "auto";

        return () => {
            audioA.current?.pause();
            audioA.current?.removeAttribute('src');
            audioB.current?.pause();
            audioB.current?.removeAttribute('src');
        };
    }, [fuente]);

    // Lógica de bucle y crossfade suave (equal-power)
    useEffect(() => {
        const TIEMPO_CROSSFADE = 2.0; // 2 segundos de transición entre loops

        const idIntervalo = setInterval(() => {
            if (!reproduciendo || volumenObjetivo === 0) return;

            const a = audioA.current;
            const b = audioB.current;
            if (!a || !b) return;

            const volumenMax = volumenObjetivo / 100;
            const actual = audioActivo.current === 'A' ? a : b;
            const siguiente = audioActivo.current === 'A' ? b : a;

            // Nos aseguramos de que el audio actual esté reproduciéndose
            if (actual.paused) {
                actual.play().catch(() => { });
            }

            // Si entramos en la zona de crossfade (cerca del final)
            if (actual.duration && actual.currentTime >= actual.duration - TIEMPO_CROSSFADE) {
                if (siguiente.paused) {
                    siguiente.currentTime = 0;
                    siguiente.volume = 0;
                    siguiente.play().catch(() => { });
                }

                const solapamiento = actual.duration - actual.currentTime; // Baja desde TIEMPO_CROSSFADE hasta 0
                const proporcion = Math.max(0, Math.min(1, solapamiento / TIEMPO_CROSSFADE)); // Baja de 1 a 0

                // Crossfade de potencia constante usando coseno (evita bajones de volumen)
                actual.volume = volumenMax * Math.cos((1 - proporcion) * 0.5 * Math.PI);
                siguiente.volume = volumenMax * Math.cos(proporcion * 0.5 * Math.PI);

                // Si se agotó el solapamiento o el navegador frenó el timer y se pasó
                if (solapamiento <= 0.25 || actual.ended) {
                    actual.pause();
                    actual.currentTime = 0;
                    audioActivo.current = audioActivo.current === 'A' ? 'B' : 'A';
                    siguiente.volume = volumenMax;
                }
            } else {
                actual.volume = volumenMax;
            }
        }, 100);

        if (!reproduciendo || volumenObjetivo === 0) {
            audioA.current?.pause();
            audioB.current?.pause();
        }

        return () => {
            clearInterval(idIntervalo);
        };
    }, [reproduciendo, volumenObjetivo]);

    return null;
};


/**
 * Panel del reproductor de música con tres pestañas:
 *  - Ambiental: mezcla de sonidos de fondo con volumen independiente.
 *  - Local: incrusta un video/track de YouTube o Spotify solo para este usuario.
 *  - Sala: comparte un video de YouTube sincronizado con todos (vía `music_state`).
 */
export const MusicPlayer = React.memo(function MusicPlayer({ salaId }: { salaId?: string }) {
    const [estaAbierto, establecerEstaAbierto] = useState(false);
    const refDesplegable = useRef<HTMLDivElement>(null);

    // Estado del modo Ambiental
    const [volumenesAmbiente, establecerVolumenesAmbiente] = useState<Record<string, number>>({});
    const [ambienteActivo, establecerAmbienteActivo] = useState(true);

    // Estado del modo Local (solo para este usuario)
    const [entradaUrlLocal, establecerEntradaUrlLocal] = useState("");
    const [urlIncrustadaLocal, establecerUrlIncrustadaLocal] = useState<string | null>(null);
    const [errorLocal, establecerErrorLocal] = useState<string | null>(null);

    // Estado del modo Sala (sincronizado entre usuarios). Las claves url/isPlaying
    // se mantienen porque viajan tal cual en la columna `music_state`.
    const [entradaUrlSala, establecerEntradaUrlSala] = useState("");
    const [estadoSala, establecerEstadoSala] = useState({ url: "", isPlaying: false });
    const [errorSala, establecerErrorSala] = useState<string | null>(null);

    // Expresiones regulares para validar enlaces de YouTube / Spotify
    const regexYoutube = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
    const regexSpotify = /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)(?:\?.*)?$/;

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

    // Suscripción a Supabase para la Música de la Sala (sincronización en tiempo real)
    useEffect(() => {
        if (!salaId) return;

        const obtenerEstado = async () => {
            const { data } = await supabase.from("rooms").select("music_state").eq("id", salaId).single();
            if (data?.music_state) {
                establecerEstadoSala(data.music_state);
            }
        };
        obtenerEstado();

        const canal = supabase.channel(`room-music-${salaId}`)
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${salaId}` }, (payload) => {
                if (payload.new && payload.new.music_state) {
                    establecerEstadoSala(payload.new.music_state);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(canal);
        };
    }, [salaId]);

    // Actualiza el estado de la música de la sala en local y lo persiste/sincroniza en Supabase
    const actualizarEstadoSala = async (nuevoEstado: Partial<typeof estadoSala>) => {
        if (!salaId) return;
        const estadoFinal = { ...estadoSala, ...nuevoEstado, updatedAt: new Date().toISOString() };
        establecerEstadoSala(estadoFinal);

        const { error } = await supabase.from("rooms").update({ music_state: estadoFinal }).eq("id", salaId);
        if (error) {
            console.error("Error de Supabase sincronizando música:", error);
            alert("⚠️ Error: No se pudo sincronizar la música con la sala.\n\nPor favor, asegúrate de haber creado la columna 'music_state' (tipo JSONB) en la tabla 'rooms' de tu Supabase.");
        }
    };

    // Carga un enlace de YouTube/Spotify en el reproductor local (solo este usuario)
    const manejarCargarLocal = (e: React.FormEvent) => {
        e.preventDefault();
        establecerErrorLocal(null);
        if (!entradaUrlLocal.trim()) { establecerUrlIncrustadaLocal(null); return; }

        const coincidenciaYt = entradaUrlLocal.match(regexYoutube);
        if (coincidenciaYt && coincidenciaYt[1]) {
            establecerUrlIncrustadaLocal(`https://www.youtube.com/embed/${coincidenciaYt[1]}?autoplay=1`);
            return;
        }

        const coincidenciaSp = entradaUrlLocal.match(regexSpotify);
        if (coincidenciaSp && coincidenciaSp[1] && coincidenciaSp[2]) {
            establecerUrlIncrustadaLocal(`https://open.spotify.com/embed/${coincidenciaSp[1]}/${coincidenciaSp[2]}?utm_source=generator&theme=0`);
            return;
        }

        establecerErrorLocal("URL inválida. Usa YouTube o Spotify.");
    };

    // Carga un enlace de YouTube para la sala sincronizada (todos lo ven)
    const manejarCargarSala = (e: React.FormEvent) => {
        e.preventDefault();
        establecerErrorSala(null);
        if (!entradaUrlSala.trim()) return;

        const coincidenciaYt = entradaUrlSala.match(regexYoutube);
        if (coincidenciaYt && coincidenciaYt[1]) {
            // Usamos la URL embebida del iframe para garantizar la reproducción
            actualizarEstadoSala({ url: `https://www.youtube.com/embed/${coincidenciaYt[1]}?autoplay=1`, isPlaying: true });
            establecerEntradaUrlSala("");
        } else {
            establecerErrorSala("Para la sala sincronizada, usa solo enlaces de YouTube.");
        }
    };

    // Indica si hay alguna fuente de audio activa (para resaltar el botón del reproductor)
    const musicaActiva = urlIncrustadaLocal || estadoSala.url || (ambienteActivo && Object.values(volumenesAmbiente).some(v => v > 0));

    return (
        <div className="relative flex items-center" ref={refDesplegable}>
            {/* Elementos de audio ocultos para los sonidos ambientales (ping-pong sin cortes) */}
            {AMBIENT_SOUNDS.map(sonido => {
                const vol = volumenesAmbiente[sonido.id] || 0;
                return (
                    <ReproductorAudioSinCortes
                        key={sonido.id}
                        fuente={sonido.archivo}
                        volumenObjetivo={vol}
                        reproduciendo={ambienteActivo}
                    />
                );
            })}

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

                    {/* PESTAÑA AMBIENTAL */}
                    <TabsContent value="ambient" className="space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-border/50">
                            <span className="text-sm font-medium text-foreground">Sonidos Activos</span>
                            <Switch checked={ambienteActivo} onCheckedChange={establecerAmbienteActivo} />
                        </div>

                        <div className="grid gap-5 max-h-[260px] overflow-y-auto pr-3 custom-scrollbar">
                            {AMBIENT_SOUNDS.map((sonido) => {
                                const Icono = sonido.icono;
                                const volumen = volumenesAmbiente[sonido.id] || 0;
                                const estaActivo = volumen > 0 && ambienteActivo;

                                return (
                                    <div key={sonido.id} className="flex items-center gap-4 group">
                                        <div className={`p-2 rounded-md transition-colors ${estaActivo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-muted/80'}`}>
                                            <Icono className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium transition-colors ${estaActivo ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {sonido.nombre}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground tabular-nums w-8 text-right">
                                                    {volumen}%
                                                </span>
                                            </div>
                                            <Slider
                                                value={[volumen]}
                                                max={100}
                                                step={1}
                                                onValueChange={(valores) => establecerVolumenesAmbiente(previa => ({ ...previa, [sonido.id]: valores[0] }))}
                                                disabled={!ambienteActivo}
                                                className={`transition-opacity ${!ambienteActivo ? "opacity-40" : ""}`}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </TabsContent>

                    {/* PESTAÑA LOCAL (INDIVIDUAL) */}
                    <TabsContent value="local" className="space-y-4">
                        <form onSubmit={manejarCargarLocal} className="flex gap-2">
                            <Input
                                value={entradaUrlLocal}
                                onChange={(e) => establecerEntradaUrlLocal(e.target.value)}
                                placeholder="YouTube o Spotify..."
                                className="flex-1 text-sm"
                            />
                            <Button type="submit" size="icon"><Play className="w-4 h-4" /></Button>
                        </form>
                        {errorLocal && <p className="text-xs text-destructive">{errorLocal}</p>}

                        <div className={`${urlIncrustadaLocal ? 'block' : 'hidden'} relative w-full rounded-md overflow-hidden bg-muted border flex flex-col items-center justify-center`}>
                            <div className={`w-full ${urlIncrustadaLocal && urlIncrustadaLocal.includes("youtube") ? "aspect-video" : "h-[152px]"}`}>
                                {urlIncrustadaLocal && (
                                    <iframe
                                        src={urlIncrustadaLocal}
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                        className="block relative z-10"
                                    ></iframe>
                                )}
                            </div>
                            <Button
                                variant="default"
                                size="icon"
                                className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm z-50"
                                onClick={() => establecerUrlIncrustadaLocal(null)}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </TabsContent>

                    {/* PESTAÑA SALA */}
                    <TabsContent value="room" className="space-y-4">
                        <form onSubmit={manejarCargarSala} className="flex gap-2">
                            <Input
                                value={entradaUrlSala}
                                onChange={(e) => establecerEntradaUrlSala(e.target.value)}
                                placeholder="Enlace de YouTube..."
                                className="flex-1 text-sm"
                            />
                            <Button type="submit" size="icon"><Radio className="w-4 h-4" /></Button>
                        </form>
                        {errorSala && <p className="text-xs text-destructive">{errorSala}</p>}

                        <div className={`${estadoSala.url ? 'block' : 'hidden'} relative w-full rounded-md overflow-hidden bg-muted border flex flex-col items-center justify-center`}>
                            <div className="w-full aspect-video relative">
                                {estadoSala.url && (
                                    <iframe
                                        src={estadoSala.url}
                                        width="100%"
                                        height="100%"
                                        frameBorder="0"
                                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                        loading="lazy"
                                        className="block relative z-10"
                                    ></iframe>
                                )}
                            </div>

                            <Button
                                variant="default"
                                size="icon"
                                className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm z-50 pointer-events-auto"
                                onClick={() => actualizarEstadoSala({ url: "", isPlaying: false })}
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                        {estadoSala.url && (
                            <p className="text-xs text-muted-foreground text-center">La música de la sala está sincronizada con todos los usuarios.</p>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
});
