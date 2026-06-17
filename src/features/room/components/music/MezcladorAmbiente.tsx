import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { AMBIENT_SOUNDS } from "./ambientSounds";

type MezcladorAmbienteProps = {
    // Volumen (0-100) por id de sonido
    volumenes: Record<string, number>;
    // Interruptor general del ambiente
    activo: boolean;
    onToggleActivo: (activo: boolean) => void;
    onCambiarVolumen: (id: string, valor: number) => void;
};

/**
 * Mezclador de sonidos ambientales (presentacional): un interruptor general y
 * un slider de volumen por cada sonido del catálogo. El estado vive en el hook
 * `useAudioAmbiente` (en el padre); acá solo se pinta y se emiten cambios.
 */
export function MezcladorAmbiente({ volumenes, activo, onToggleActivo, onCambiarVolumen }: MezcladorAmbienteProps) {
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <span className="text-sm font-medium text-foreground">Sonidos Activos</span>
                <Switch checked={activo} onCheckedChange={onToggleActivo} />
            </div>

            <div className="grid gap-5 max-h-[260px] overflow-y-auto pr-3 custom-scrollbar">
                {AMBIENT_SOUNDS.map((sonido) => {
                    const Icono = sonido.icono;
                    const volumen = volumenes[sonido.id] || 0;
                    const estaActivo = volumen > 0 && activo;

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
                                    onValueChange={(valores) => onCambiarVolumen(sonido.id, valores[0] ?? 0)}
                                    disabled={!activo}
                                    className={`transition-opacity ${!activo ? "opacity-40" : ""}`}
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
