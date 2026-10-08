import React, { useEffect, useRef, useState } from "react";
import { Link2, MonitorPlay, Music, Pause, Play, User, Volume2, VolumeX, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/features/auth/context/useAuth";
import { useMusicaSala } from "@/features/room/hooks/useMusicaSala";
import { useAudioAmbiente } from "@/features/room/hooks/useAudioAmbiente";
import { claseControl, clasePanel, claseRotulo } from "@/features/timer/clasesReloj";
import { cn } from "@/lib/utils";
import { AMBIENT_SOUNDS } from "./music/ambientSounds";
import { ReproductorAudioSinCortes } from "./music/ReproductorAudioSinCortes";
import { parsearYoutube } from "./music/parsearUrlMedia";

/** Con más de estos sonidos, la grilla muestra los primeros y «Ver los N» despliega el resto. */
const A_LA_VISTA = 12;

/** El video acepta órdenes por postMessage (volumen) solo con la API de iframes prendida. */
const conApi = (url: string) => (url.includes("enablejsapi") ? url : `${url}${url.includes("?") ? "&" : "?"}enablejsapi=1`);

const mandarVolumen = (video: HTMLIFrameElement | null, volumen: number) =>
    video?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [volumen] }), "*");

const botonChico = "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-3.5";

/**
 * La música de la sala (M7 · Todo junto, se despliega): un panel pegado al botón
 * con «Pausar todo» arriba y dos partes. **Ambiente · solo vos**: los volúmenes de
 * lo que suena y la grilla de sonidos; la última mezcla se guarda sola. **Para la
 * sala**: el video de YouTube que escuchan todos, que se cambia sin sacarlo, y
 * «Silenciar para mí» (local, no toca `music_state`).
 *
 * Los motores de audio y el video quedan montados aunque el panel esté cerrado.
 */
export const MusicPlayer = React.memo(function MusicPlayer({ salaId, enLaSala }: { salaId?: string; enLaSala: number }) {
    const { volumenes, activo, establecerActivo, establecerVolumen, hayAmbienteActivo } = useAudioAmbiente();
    const { estadoSala, actualizarEstadoSala } = useMusicaSala(salaId);
    const { user } = useAuth();
    const [silenciada, establecerSilenciada] = useState(false);
    const [verTodos, establecerVerTodos] = useState(false);
    const [cambiandoVideo, establecerCambiandoVideo] = useState(false);
    const [link, establecerLink] = useState("");
    const [error, establecerError] = useState<string | null>(null);
    // El volumen del video es de cada uno, como «Silenciar para mí»: no toca `music_state`
    const [volumenVideo, establecerVolumenVideo] = useState(70);
    const video = useRef<HTMLIFrameElement>(null);
    useEffect(() => mandarVolumen(video.current, volumenVideo), [volumenVideo]);

    const sonando = AMBIENT_SOUNDS.filter((s) => (volumenes[s.id] ?? 0) > 0);
    const videoSuena = Boolean(estadoSala.url) && !silenciada;
    const suenaAlgo = hayAmbienteActivo || videoSuena;
    const visibles = verTodos || AMBIENT_SOUNDS.length <= A_LA_VISTA ? AMBIENT_SOUNDS : AMBIENT_SOUNDS.slice(0, 8);

    const pausarTodo = () => {
        const pausar = suenaAlgo;
        establecerActivo(!pausar);
        establecerSilenciada(pausar);
    };

    const ponerVideo = (e: React.FormEvent) => {
        e.preventDefault();
        const url = parsearYoutube(link);
        if (!url) {
            establecerError("Tiene que ser un link de YouTube.");
            return;
        }
        actualizarEstadoSala({ url, isPlaying: true, puestaPor: user?.name || "Alguien" });
        establecerLink("");
        establecerError(null);
        establecerCambiandoVideo(false);
        establecerSilenciada(false);
    };

    const campoVideo = (
        <form onSubmit={ponerVideo} className="flex flex-col gap-1.5">
            <input
                autoFocus={cambiandoVideo}
                value={link}
                onChange={(e) => establecerLink(e.target.value)}
                placeholder={estadoSala.url ? "Pegá otro link de YouTube" : "Pegá un link de YouTube para la sala"}
                aria-label="Link de YouTube para la sala"
                className="h-[2.375rem] w-full border-0 border-b bg-transparent text-[0.875rem] outline-none placeholder:text-muted-foreground focus:border-brand"
            />
            {error && <p className="m-0 text-[0.75rem] text-destructive">{error}</p>}
        </form>
    );

    return (
        <>
            {AMBIENT_SOUNDS.map((sonido) => (
                <ReproductorAudioSinCortes key={sonido.id} fuente={sonido.archivo} volumenObjetivo={volumenes[sonido.id] ?? 0} reproduciendo={activo} />
            ))}
            {/* El video de la sala suena aunque el panel esté cerrado; silenciado, no se carga */}
            {videoSuena && (
                <iframe
                    ref={video}
                    src={conApi(estadoSala.url)}
                    // ponytail: el reproductor tarda en estar listo después del load; si se pierde la orden, queda en 100 hasta mover la barra
                    onLoad={() => setTimeout(() => mandarVolumen(video.current, volumenVideo), 1000)}
                    title="Música de la sala"
                    allow="autoplay; encrypted-media"
                    className="pointer-events-none fixed -left-[200vw] size-px opacity-0"
                />
            )}

            <Popover>
                <PopoverTrigger className={claseControl} title="Música" aria-label="Música">
                    <Music />
                    {suenaAlgo && <span className="absolute top-[0.4375rem] right-[0.4375rem] size-1.5 rounded-full bg-brand" />}
                </PopoverTrigger>
                <PopoverContent align="start" sideOffset={10} className={cn(clasePanel, "flex flex-col gap-3")}>
                    <div className="flex items-center justify-between">
                        <span className={claseRotulo}>Música</span>
                        {(suenaAlgo || !activo || silenciada) && (sonando.length > 0 || estadoSala.url) && (
                            <button type="button" onClick={pausarTodo} className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[0.8125rem] text-muted-foreground hover:text-foreground">
                                {suenaAlgo ? <Pause className="size-3 fill-current" /> : <Play className="size-3 fill-current" />}
                                {suenaAlgo ? "Pausar todo" : "Reanudar"}
                            </button>
                        )}
                    </div>

                    <section aria-label="Ambiente, solo vos" className="flex flex-col gap-1.5 border-t pt-3">
                        <p className={`${claseRotulo} m-0`}>
                            Ambiente <span className="ml-1 tracking-normal normal-case">solo vos</span>
                        </p>
                        {videoSuena && (
                            <label className="grid grid-cols-[1rem_4.5rem_minmax(0,1fr)_1.75rem] items-center gap-2 text-[0.84375rem]">
                                <MonitorPlay className="size-4 text-brand" aria-hidden />
                                <span className="truncate">Video</span>
                                <input
                                    type="range" min={0} max={100}
                                    value={volumenVideo}
                                    onChange={(e) => establecerVolumenVideo(Number(e.target.value))}
                                    aria-label="Volumen del video de la sala"
                                    className="w-full accent-[var(--brand)]"
                                />
                                <button type="button" onClick={() => establecerSilenciada(true)} aria-label="Silenciar el video para mí" title="Silenciar para mí" className={botonChico}>
                                    <X />
                                </button>
                            </label>
                        )}
                        {sonando.map((s) => (
                            <label key={s.id} className="grid grid-cols-[1rem_4.5rem_minmax(0,1fr)_1.75rem] items-center gap-2 text-[0.84375rem]">
                                <s.icono className="size-4 text-brand" aria-hidden />
                                <span className="truncate">{s.nombre}</span>
                                <input
                                    type="range" min={0} max={100}
                                    value={volumenes[s.id]}
                                    onChange={(e) => establecerVolumen(s.id, Number(e.target.value))}
                                    aria-label={`Volumen de ${s.nombre}`}
                                    className="w-full accent-[var(--brand)]"
                                />
                                <button type="button" onClick={() => establecerVolumen(s.id, 0)} aria-label={`Apagar ${s.nombre}`} className={botonChico}>
                                    <X />
                                </button>
                            </label>
                        ))}
                        <div className="mt-1 grid grid-cols-4 gap-y-1">
                            {visibles.map((s) => {
                                const prendido = (volumenes[s.id] ?? 0) > 0;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        aria-pressed={prendido}
                                        onClick={() => establecerVolumen(s.id, prendido ? 0 : 45)}
                                        className="flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[0.71875rem] text-muted-foreground hover:bg-muted hover:text-foreground aria-pressed:text-foreground"
                                    >
                                        <s.icono className={cn("size-4", prendido && "text-brand")} aria-hidden />
                                        <span className="w-full truncate text-center">{s.nombre}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {visibles.length < AMBIENT_SOUNDS.length && (
                            <button type="button" onClick={() => establecerVerTodos(true)} className="self-start text-[0.8125rem] text-muted-foreground hover:text-foreground">
                                Ver los {AMBIENT_SOUNDS.length}
                            </button>
                        )}
                    </section>

                    {salaId && (
                        <section aria-label="Para la sala" className="flex flex-col gap-2 border-t pt-3">
                            <p className={`${claseRotulo} m-0`}>
                                Para la sala <span className="ml-1 tracking-normal normal-case">{enLaSala > 1 ? `los ${enLaSala}` : "todos"}</span>
                            </p>
                            {estadoSala.url ? (
                                <>
                                    <div className="flex items-center gap-2">
                                        <User className="size-4 shrink-0 text-brand" aria-hidden />
                                        <span className="flex min-w-0 flex-1 flex-col leading-tight">
                                            <b className="truncate text-[0.84375rem] font-medium">Video de YouTube</b>
                                            <small className="truncate text-[0.75rem] text-muted-foreground">
                                                {estadoSala.puestaPor ? `Lo puso ${estadoSala.puestaPor}` : "Suena para todos"}
                                            </small>
                                        </span>
                                        <button type="button" onClick={() => establecerCambiandoVideo(!cambiandoVideo)} aria-expanded={cambiandoVideo} title="Poner otro video" aria-label="Poner otro video" className={botonChico}>
                                            <Link2 />
                                        </button>
                                        <button type="button" onClick={() => establecerSilenciada(!silenciada)} title={silenciada ? "Escucharlo" : "Silenciar para mí"} aria-label={silenciada ? "Escucharlo" : "Silenciar para mí"} className={botonChico}>
                                            {silenciada ? <VolumeX /> : <Volume2 />}
                                        </button>
                                        <button type="button" onClick={() => actualizarEstadoSala({ url: "", isPlaying: false })} title="Sacarlo para todos" aria-label="Sacarlo para todos" className={botonChico}>
                                            <X />
                                        </button>
                                    </div>
                                    {cambiandoVideo && campoVideo}
                                </>
                            ) : (
                                campoVideo
                            )}
                        </section>
                    )}
                </PopoverContent>
            </Popover>
        </>
    );
});
