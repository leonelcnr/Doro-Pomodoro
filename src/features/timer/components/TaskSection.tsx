import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

// IMPORTANTE: `TaskSection` es un scratchpad EFÍMERO y SEPARADO del modelo real
// de tareas. Su estado vive solo en memoria (no persiste en Supabase) y por eso
// NO usa el tipo de dominio `Tarea` (tabla `tasks`): tiene su propia forma mínima
// (`TareaScratchpad`, con `texto`/`completada`). Hoy el componente no se monta en
// ninguna pantalla; se conserva como borrador. Si algún día debe persistir,
// migrar a `useTareas` + el tipo `Tarea` de `@/types/dominio` (ver plan 2.6).
interface TareaScratchpad {
    id: string;
    texto: string;
    completada: boolean;
}

interface PropsListaTareas {
    tareas: TareaScratchpad[];
    tipo: "personal" | "sala";
    nuevaTareaTexto: string;
    establecerNuevaTareaTexto: (texto: string) => void;
    agregarTarea: (tipo: "personal" | "sala") => void;
    alternarTarea: (id: string, tipo: "personal" | "sala") => void;
    eliminarTarea: (id: string, tipo: "personal" | "sala") => void;
}

/**
 * Fila individual de una tarea. Al marcar una tarea no completada, reproduce
 * primero la animación de tachado y recién después la marca como completada.
 */
const ItemTarea = ({
    tarea,
    tipo,
    alAlternar,
    alEliminar
}: {
    tarea: TareaScratchpad;
    tipo: "personal" | "sala";
    alAlternar: (id: string, tipo: "personal" | "sala") => void;
    alEliminar: (id: string, tipo: "personal" | "sala") => void;
}) => {
    const [animandoCompletado, establecerAnimandoCompletado] = useState(false);

    // Visualmente aparece "marcada" si ya estaba completada o está en plena animación
    const estaMarcada = tarea.completada || animandoCompletado;

    const manejarAlternar = () => {
        if (!tarea.completada) {
            establecerAnimandoCompletado(true);
            // Esperamos a que termine la animación de tachado (~400ms) antes de completar
            setTimeout(() => {
                alAlternar(tarea.id, tipo);
            }, 400);
        } else {
            alAlternar(tarea.id, tipo);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="flex items-center justify-between p-3 rounded-xl border bg-card/50 hover:bg-accent/40 transition-all group shadow-sm"
        >
            <div className="flex items-center gap-3 flex-1 overflow-hidden pr-2">
                <Checkbox
                    checked={estaMarcada}
                    onCheckedChange={manejarAlternar}
                    className="self-start mt-0.5" // Alinear el checkbox con la primera línea de texto
                />
                <div className="flex-1">
                    <span
                        style={{
                            backgroundImage: "linear-gradient(transparent calc(50% - 1px), currentColor calc(50% - 1px), currentColor calc(50% + 1px), transparent calc(50% + 1px))",
                            backgroundSize: estaMarcada ? "100% 100%" : "0% 100%",
                            backgroundRepeat: "no-repeat",
                            transition: "background-size 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.4s ease-out, opacity 0.4s ease-out",
                        }}
                        className={`text-sm inline wrap-break-word ${estaMarcada ? "text-muted-foreground opacity-70" : "text-foreground font-medium"}`}
                    >
                        {tarea.texto}
                    </span>
                </div>
            </div>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => alEliminar(tarea.id, tipo)}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </motion.div>
    );
};

/**
 * Lista de tareas con input para agregar y filtro entre pendientes/completadas.
 */
const ListaTareas = ({
    tareas,
    tipo,
    nuevaTareaTexto,
    establecerNuevaTareaTexto,
    agregarTarea,
    alternarTarea,
    eliminarTarea,
}: PropsListaTareas) => {
    const [filtro, establecerFiltro] = useState<"pendientes" | "completadas">("pendientes");

    const tareasFiltradas = tareas.filter(tarea =>
        filtro === "completadas" ? tarea.completada : !tarea.completada
    );

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Añadir una nueva tarea..."
                    value={nuevaTareaTexto}
                    onChange={(e) => establecerNuevaTareaTexto(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && agregarTarea(tipo)}
                    className="bg-muted/50 focus-visible:ring-1 focus-visible:ring-offset-0"
                />
                <Button onClick={() => agregarTarea(tipo)} size="icon" className="shrink-0">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant={filtro === "pendientes" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => establecerFiltro("pendientes")}
                    className={`h-7 text-xs rounded-full px-3 transition-colors ${filtro === "pendientes" ? "shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                    Pendientes <span className="ml-1.5 opacity-70 bg-background/20 px-1.5 rounded-md">{tareas.filter(t => !t.completada).length}</span>
                </Button>
                <Button
                    variant={filtro === "completadas" ? "default" : "secondary"}
                    size="sm"
                    onClick={() => establecerFiltro("completadas")}
                    className={`h-7 text-xs rounded-full px-3 transition-colors ${filtro === "completadas" ? "shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                >
                    Completadas <span className="ml-1.5 opacity-70 bg-background/20 px-1.5 rounded-md">{tareas.filter(t => t.completada).length}</span>
                </Button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar min-h-[100px]">
                <AnimatePresence mode="popLayout">
                    {tareasFiltradas.length === 0 ? (
                        <motion.p
                            key="empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center text-muted-foreground py-10 text-sm italic"
                        >
                            {filtro === "pendientes" ? "¡Todo al día! No hay tareas pendientes." : "Aún no hay tareas completadas."}
                        </motion.p>
                    ) : (
                        tareasFiltradas.map((tarea) => (
                            <ItemTarea
                                key={tarea.id}
                                tarea={tarea}
                                tipo={tipo}
                                alAlternar={alternarTarea}
                                alEliminar={eliminarTarea}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

/**
 * Sección de tareas con dos pestañas: tareas personales y tareas de la sala.
 * Por ahora ambos listados viven solo en memoria (estado local del componente).
 */
export const TaskSection = () => {
    const [tareasPersonales, establecerTareasPersonales] = useState<TareaScratchpad[]>([]);
    const [tareasSala, establecerTareasSala] = useState<TareaScratchpad[]>([]);
    const [nuevaTareaTexto, establecerNuevaTareaTexto] = useState("");

    const agregarTarea = (tipo: "personal" | "sala") => {
        if (!nuevaTareaTexto.trim()) return;
        const nuevaTarea: TareaScratchpad = {
            id: crypto.randomUUID(),
            texto: nuevaTareaTexto,
            completada: false,
        };
        if (tipo === "personal") {
            establecerTareasPersonales(previas => [...previas, nuevaTarea]);
        } else {
            establecerTareasSala(previas => [...previas, nuevaTarea]);
        }
        establecerNuevaTareaTexto("");
    };

    const alternarTarea = (id: string, tipo: "personal" | "sala") => {
        const actualizarTareas = (tareas: TareaScratchpad[]) =>
            tareas.map((t) => (t.id === id ? { ...t, completada: !t.completada } : t));
        if (tipo === "personal") {
            establecerTareasPersonales(previas => actualizarTareas(previas));
        } else {
            establecerTareasSala(previas => actualizarTareas(previas));
        }
    };

    const eliminarTarea = (id: string, tipo: "personal" | "sala") => {
        if (tipo === "personal") {
            establecerTareasPersonales(previas => previas.filter((t) => t.id !== id));
        } else {
            establecerTareasSala(previas => previas.filter((t) => t.id !== id));
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto border-none shadow-none bg-transparent">
            <CardHeader className="px-0">
                <CardTitle className="text-2xl font-bold tracking-tight text-center sm:text-left">Tareas</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
                <Tabs defaultValue="personal" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-muted/30 p-1 rounded-xl">
                        <TabsTrigger value="personal" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md py-2.5 transition-all">
                            Mis Tareas
                        </TabsTrigger>
                        <TabsTrigger value="sala" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-md py-2.5 transition-all">
                            Tareas de la Sala
                        </TabsTrigger>
                    </TabsList>
                    <div className="mt-8">
                        <TabsContent value="personal" className="focus-visible:outline-none mt-0">
                            <ListaTareas
                                tareas={tareasPersonales}
                                tipo="personal"
                                nuevaTareaTexto={nuevaTareaTexto}
                                establecerNuevaTareaTexto={establecerNuevaTareaTexto}
                                agregarTarea={agregarTarea}
                                alternarTarea={alternarTarea}
                                eliminarTarea={eliminarTarea}
                            />
                        </TabsContent>
                        <TabsContent value="sala" className="focus-visible:outline-none mt-0">
                            <ListaTareas
                                tareas={tareasSala}
                                tipo="sala"
                                nuevaTareaTexto={nuevaTareaTexto}
                                establecerNuevaTareaTexto={establecerNuevaTareaTexto}
                                agregarTarea={agregarTarea}
                                alternarTarea={alternarTarea}
                                eliminarTarea={eliminarTarea}
                            />
                        </TabsContent>
                    </div>
                </Tabs>
            </CardContent>
        </Card>
    );
};
