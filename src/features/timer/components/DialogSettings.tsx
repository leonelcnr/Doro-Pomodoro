import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, Minus, Plus } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { TimerSettings } from "@/types/timer";

interface PropsDialogSettings {
    configuracionActual: TimerSettings;
    alGuardarConfiguracion: (nuevaConfiguracion: TimerSettings) => void;
}

interface PropsEntradaNumero {
    id: string;
    valor: number;
    alCambiar: (valor: number) => void;
    minimo?: number;
}

/**
 * Input numérico controlado con botones +/-. Mantiene un estado local de texto
 * para permitir escribir libremente y valida/normaliza recién al perder el foco.
 */
const EntradaNumero: React.FC<PropsEntradaNumero> = ({ id, valor, alCambiar, minimo = 1 }) => {
    const [valorLocal, establecerValorLocal] = useState(valor.toString());

    // Sincronizamos el estado local cuando el valor externo cambia
    useEffect(() => {
        establecerValorLocal(valor.toString());
    }, [valor]);

    const manejarCambio = (e: React.ChangeEvent<HTMLInputElement>) => {
        const texto = e.target.value;
        establecerValorLocal(texto);

        // Avisamos al padre de inmediato si el valor es válido, para que guardar funcione fluido
        if (texto !== "") {
            const parseado = parseInt(texto, 10);
            if (!isNaN(parseado)) {
                alCambiar(parseado);
            }
        }
    };

    const manejarBlur = () => {
        // Si el campo quedó vacío o inválido, restauramos al mínimo (o al valor válido)
        const parseado = parseInt(valorLocal, 10);
        if (valorLocal === "" || isNaN(parseado) || parseado < minimo) {
            establecerValorLocal(minimo.toString());
            alCambiar(minimo);
        } else {
            establecerValorLocal(parseado.toString());
            alCambiar(parseado);
        }
    };

    return (
        <div className="flex items-center border border-input rounded-md overflow-hidden bg-transparent h-9">
            <input
                id={id}
                type="number"
                min={minimo}
                value={valorLocal}
                onChange={manejarCambio}
                onBlur={manejarBlur}
                className="w-16 bg-transparent text-center text-sm outline-none px-2 appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none text-white"
            />
            <div className="flex items-center border-l border-input">
                <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 rounded-none hover:bg-accent hover:text-accent-foreground p-0 text-muted-foreground"
                    onClick={() => {
                        const siguiente = Math.max(minimo, valor - 1);
                        establecerValorLocal(siguiente.toString());
                        alCambiar(siguiente);
                    }}
                >
                    <Minus className="h-4 w-4" />
                </Button>
                <div className="w-px h-9 bg-border" />
                <Button
                    type="button"
                    variant="ghost"
                    className="h-9 w-9 rounded-none hover:bg-accent hover:text-accent-foreground p-0 text-muted-foreground"
                    onClick={() => {
                        const siguiente = valor + 1;
                        establecerValorLocal(siguiente.toString());
                        alCambiar(siguiente);
                    }}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

/**
 * Diálogo de configuración del reloj: permite ajustar las duraciones de cada
 * fase y activar el descanso automático. Trabaja sobre una copia local de la
 * configuración y la confirma con "Guardar Cambios".
 */
const DialogSettings: React.FC<PropsDialogSettings> = ({
    configuracionActual,
    alGuardarConfiguracion
}) => {
    // Estado local para manejar los inputs antes de guardar
    const [configuracion, establecerConfiguracion] = useState<TimerSettings>(configuracionActual);

    // Actualiza un único campo de la configuración local de forma tipada
    const manejarActualizacion = <K extends keyof TimerSettings>(nombre: K, valor: TimerSettings[K]) => {
        establecerConfiguracion((previa) => ({
            ...previa,
            [nombre]: valor,
        }));
    };

    const manejarGuardar = () => {
        alGuardarConfiguracion(configuracion);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                    <Settings />
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Configuración del Reloj</DialogTitle>
                    <DialogDescription>
                        Ajusta los minutos para cada fase de tu sesión de estudio.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-6 py-4">
                    {/* Input Pomodoro */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="pomodoro" className="text-base font-medium">
                                Pomodoro
                            </Label>
                            <span className="text-sm text-muted-foreground">Duración de la sesión de enfoque.</span>
                        </div>
                        <EntradaNumero
                            id="pomodoro"
                            valor={configuracion.pomodoro}
                            alCambiar={(valor) => manejarActualizacion("pomodoro", valor)}
                        />
                    </div>

                    {/* Input Descanso Corto */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="shortBreak" className="text-base font-medium">
                                Descanso Corto
                            </Label>
                            <span className="text-sm text-muted-foreground">Pausa breve entre pomodoros.</span>
                        </div>
                        <EntradaNumero
                            id="shortBreak"
                            valor={configuracion.shortBreak}
                            alCambiar={(valor) => manejarActualizacion("shortBreak", valor)}
                        />
                    </div>

                    {/* Input Descanso Largo */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="longBreak" className="text-base font-medium">
                                Descanso Largo
                            </Label>
                            <span className="text-sm text-muted-foreground">Pausa más extensa tras varios ciclos.</span>
                        </div>
                        <EntradaNumero
                            id="longBreak"
                            valor={configuracion.longBreak}
                            alCambiar={(valor) => manejarActualizacion("longBreak", valor)}
                        />
                    </div>

                    {/* Switch Descanso Automático */}
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="autoBreak" className="text-base font-medium">
                                Descanso Automático
                            </Label>
                            <span className="text-sm text-muted-foreground">Inicia el descanso al terminar un pomodoro.</span>
                        </div>
                        <Switch
                            id="autoBreak"
                            checked={configuracion.autoBreak}
                            onCheckedChange={(valor) => manejarActualizacion("autoBreak", valor)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            type="submit"
                            onClick={manejarGuardar}
                        >
                            Guardar Cambios
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default React.memo(DialogSettings);
