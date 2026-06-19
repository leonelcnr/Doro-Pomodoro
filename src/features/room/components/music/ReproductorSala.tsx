import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Radio, X } from "lucide-react";
import type { EstadoMusicaSala } from "@/types/dominio";

type ReproductorSalaProps = {
    entrada: string;
    onEntradaChange: (valor: string) => void;
    error: string | null;
    onSubmit: (e: React.FormEvent) => void;
    estadoSala: EstadoMusicaSala;
    onLimpiar: () => void;
};

/**
 * Reproductor sincronizado de la sala: comparte un video de YouTube con todos
 * los usuarios. Presentacional/controlado: el estado del formulario y el estado
 * compartido (`useMusicaSala`) viven en el contenedor `MusicPlayer`.
 */
export function ReproductorSala({ entrada, onEntradaChange, error, onSubmit, estadoSala, onLimpiar }: ReproductorSalaProps) {
    return (
        <div className="space-y-4">
            <form onSubmit={onSubmit} className="flex gap-2">
                <Input
                    value={entrada}
                    onChange={(e) => onEntradaChange(e.target.value)}
                    placeholder="Enlace de YouTube..."
                    className="flex-1 text-sm"
                />
                <Button type="submit" size="icon"><Radio className="w-4 h-4" /></Button>
            </form>
            {error && <p className="text-xs text-destructive">{error}</p>}

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
                    onClick={onLimpiar}
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>
            {estadoSala.url && (
                <p className="text-xs text-muted-foreground text-center">La música de la sala está sincronizada con todos los usuarios.</p>
            )}
        </div>
    );
}
