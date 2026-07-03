import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Share2, Copy, Check } from 'lucide-react'
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Diálogo para compartir la sala: muestra el enlace de invitación y el código,
 * con botones que copian cada valor al portapapeles y un feedback animado.
 */
const DialogShare = ({ enlace, codigo }: { enlace: string, codigo: string }) => {
    // Guarda cuál de los dos campos se acaba de copiar (para mostrar el tilde)
    const [copiado, establecerCopiado] = useState<string | null>(null);

    // Copia el texto al portapapeles y marca el campo como copiado durante 2 segundos
    const manejarCopiar = (texto: string, tipo: string) => {
        navigator.clipboard.writeText(texto);
        establecerCopiado(tipo);
        setTimeout(() => establecerCopiado(null), 2000);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10"><Share2 /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Compartir enlace</DialogTitle>
                    <DialogDescription>
                        Cualquiera que tenga este enlace podrá unirse a la sala.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col items-center gap-2">
                    <div className="w-full grid flex-1 gap-2">
                        <Label htmlFor="enlace" className="">
                            Enlace
                        </Label>
                        <div className="flex items-center space-x-2">
                            <Input
                                id="enlace"
                                defaultValue={enlace}
                                readOnly
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="px-3"
                                onClick={() => manejarCopiar(enlace, 'enlace')}
                            >
                                <span className="sr-only">Copiar enlace</span>
                                <AnimatePresence mode="wait" initial={false}>
                                    {copiado === 'enlace' ? (
                                        <motion.div
                                            key="check"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <Check className="h-4 w-4 text-green-500" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </div>
                    </div>
                    <div className="w-full grid flex-1 gap-2">
                        <Label htmlFor="codigo" className="">
                            Código
                        </Label>
                        <div className="flex items-center space-x-2">
                            <Input
                                id="codigo"
                                defaultValue={codigo}
                                readOnly
                            />
                            <Button
                                type="button"
                                size="icon"
                                variant="secondary"
                                className="px-3"
                                onClick={() => manejarCopiar(codigo, 'codigo')}
                            >
                                <span className="sr-only">Copiar código</span>
                                <AnimatePresence mode="wait" initial={false}>
                                    {copiado === 'codigo' ? (
                                        <motion.div
                                            key="check"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <Check className="h-4 w-4 text-green-500" />
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="copy"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.5 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            <Copy className="h-4 w-4" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Button>
                        </div>
                    </div>
                </div>
                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button type="button">Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default React.memo(DialogShare);
