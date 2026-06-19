import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, X } from "lucide-react";

type ReproductorLocalProps = {
    entrada: string;
    onEntradaChange: (valor: string) => void;
    // URL ya embebida y validada (o null si no hay nada cargado)
    urlIncrustada: string | null;
    error: string | null;
    onSubmit: (e: React.FormEvent) => void;
    onLimpiar: () => void;
};

/**
 * Reproductor "local" (solo para este usuario): incrusta un video/track de
 * YouTube o Spotify. Es presentacional/controlado: el estado (entrada, embed,
 * error) vive en el contenedor `MusicPlayer` para que persista al cambiar de
 * pestaña; acá solo se pinta el formulario y el iframe.
 */
export function ReproductorLocal({ entrada, onEntradaChange, urlIncrustada, error, onSubmit, onLimpiar }: ReproductorLocalProps) {
    return (
        <div className="space-y-4">
            <form onSubmit={onSubmit} className="flex gap-2">
                <Input
                    value={entrada}
                    onChange={(e) => onEntradaChange(e.target.value)}
                    placeholder="YouTube o Spotify..."
                    className="flex-1 text-sm"
                />
                <Button type="submit" size="icon"><Play className="w-4 h-4" /></Button>
            </form>
            {error && <p className="text-xs text-destructive">{error}</p>}

            <div className={`${urlIncrustada ? 'block' : 'hidden'} relative w-full rounded-md overflow-hidden bg-muted border flex flex-col items-center justify-center`}>
                <div className={`w-full ${urlIncrustada && urlIncrustada.includes("youtube") ? "aspect-video" : "h-[152px]"}`}>
                    {urlIncrustada && (
                        <iframe
                            src={urlIncrustada}
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
                    onClick={onLimpiar}
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
