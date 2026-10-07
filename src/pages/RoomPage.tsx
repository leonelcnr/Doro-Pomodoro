import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import * as salasService from "@/features/room/services/salasService";
import { TimerDisplay } from "@/features/timer/components/TimerDisplay";
import { useTareas } from "@/features/tasks/hooks/useTareas";
import { useTemas } from "@/features/tasks/hooks/useTemas";
import { useFoco } from "@/features/tasks/hooks/useFoco";
import { usePresenciaSala } from "@/features/room/hooks/usePresenciaSala";
import { useNotas } from "@/features/room/hooks/useNotas";
import { useSincronizacionReloj } from "@/features/timer/hooks/useSincronizacionReloj";
import { CabeceraSala } from "@/features/room/components/CabeceraSala";
import { BandejaNotas } from "@/features/room/components/BandejaNotas";
import { PestanasTareas, TareasDeLaSala, type AmbitoBandeja } from "@/features/room/components/TareasDeLaSala";
import { BandejaTareas } from "@/features/tasks/components/bandeja/BandejaTareas";
import { INFO_TIPO, estaPendiente } from "@/features/tasks/bandeja";
import { tipoDe } from "@/features/tasks/avance";
import { useTimerStore } from "@/store/timerStore";
import { useQuieto } from "@/hooks/useQuieto";
import { DoorClosed } from "lucide-react";
import { EncabezadoApp } from "@/components/encabezado/EncabezadoApp";
import { CargaArco, EstadoColumna, LineaLink } from "@/components/estados/EstadoColumna";
import { claseBotonAcento } from "@/components/estados/clases";
import { useSalaNueva } from "@/features/home/hooks/useSalaNueva";
import { useAuth } from "@/features/auth/context/useAuth";
import { esUuid } from "@/lib/uuid";
import { cn } from "@/lib/utils";
import type { Invitacion, ItemChecklist, Tarea, TareaPayload } from "@/types/dominio";
import type { Modo } from "@/types/timer";

// Una invitación es válida si no expiró (no tiene tope de usos: las salas son espontáneas)
function InvitacionValida(inv: Invitacion) {
    return !inv.expires_at || new Date(inv.expires_at).getTime() > Date.now();
}

const NOMBRE_FASE: Record<Modo, string> = {
    pomodoro: "Pomodoro",
    shortBreak: "Descanso corto",
    longBreak: "Descanso largo",
    stopwatch: "Cronómetro",
};

// Por debajo de este ancho no entran tareas y notas abiertas a la vez: abrir una cierra la otra
const SIN_LUGAR_PARA_LAS_DOS = "(max-width: 86.5rem)";

/**
 * Página de una sala (4 · Queda el lápiz): el reloj en el centro, la bandeja de
 * tareas abajo (T43 con «Mías / De la sala») y las notas en post-it abajo a la
 * derecha. Con el reloj corriendo y el mouse quieto, queda solo el reloj.
 * Es un contenedor: orquesta los hooks de dominio y compone las piezas.
 */
const RoomPage = () => {
    // `roomId` viene de la URL (entrada no confiable): solo es id de sala si es un UUID
    const { roomId } = useParams();
    const salaIdValida = roomId && esUuid(roomId) ? roomId : undefined;
    const [invitacion, establecerInvitacion] = useState<Invitacion | null>();
    const [cargandoInvitacion, establecerCargandoInvitacion] = useState<boolean>(false);
    const [error, establecerError] = useState<string | null>(null);
    const usuario = useAuth().user;
    const { creando, crearSala, unirse } = useSalaNueva();

    const usuariosEnSala = usePresenciaSala(salaIdValida);
    const { tareas, crearTarea, actualizarTareaCampos } = useTareas(salaIdValida);
    const { temas } = useTemas();
    const { notas, agregar, quitar, borrarTodas, ponerTema } = useNotas();
    useSincronizacionReloj(salaIdValida);
    const { estaActivo, modo } = useTimerStore();
    const quieto = useQuieto(estaActivo);

    const mias = useMemo(() => tareas.filter((t) => t.room_id == null), [tareas]);
    const deLaSala = useMemo(() => tareas.filter((t) => t.room_id === salaIdValida), [tareas, salaIdValida]);
    const { foco, enfocar, soltar } = useFoco(mias);

    const [bandejaAbierta, establecerBandejaAbierta] = useState(false);
    const [notasAbiertas, establecerNotasAbiertas] = useState(false);
    const [ambito, establecerAmbito] = useState<AmbitoBandeja>("mias");
    // Lo de la sala sumado por otros después de esta marca, sin haberlo mirado, pinta la rayita
    const [vistoHasta, establecerVistoHasta] = useState(() => new Date().toISOString());
    const mirandoLaSala = bandejaAbierta && ambito === "sala";
    const nuevas = !mirandoLaSala && deLaSala.some((t) => t.user_id !== usuario?.id && (t.created_at ?? "") > vistoHasta);

    // Al entrar: aseguramos la membresía (RLS) y después la invitación, que no bloquea
    useEffect(() => {
        if (!roomId) return;
        if (!salaIdValida) {
            establecerCargandoInvitacion(false);
            establecerError("El identificador de la sala no es válido.");
            return;
        }
        const cargarSala = async () => {
            establecerCargandoInvitacion(true);
            establecerError(null);
            try {
                await salasService.unirseASalaPorId(salaIdValida);
            } catch (e: unknown) {
                establecerCargandoInvitacion(false);
                console.error("Error al unirse a la sala:", e);
                establecerError(e instanceof Error ? e.message : "sin detalle");
                return;
            }
            try {
                const invitacionData = await salasService.obtenerInvitacion(salaIdValida);
                establecerInvitacion(invitacionData && InvitacionValida(invitacionData) ? invitacionData : null);
            } catch (e: unknown) {
                console.error("Error al cargar la invitación (no bloquea la sala):", e);
                establecerInvitacion(null);
            } finally {
                establecerCargandoInvitacion(false);
            }
        };
        cargarSala();
    }, [roomId, salaIdValida, usuario?.id]);

    const enlaceInvitacion = useMemo(
        () => (invitacion?.code ? `${window.location.origin}/invitacion/${invitacion.code}` : null),
        [invitacion?.code],
    );

    const abrirBandeja = useCallback((abierta: boolean) => {
        establecerBandejaAbierta(abierta);
        if (abierta && matchMedia(SIN_LUGAR_PARA_LAS_DOS).matches) establecerNotasAbiertas(false);
        if (ambito === "sala") establecerVistoHasta(new Date().toISOString());
    }, [ambito]);
    const abrirNotas = useCallback((abiertas: boolean) => {
        establecerNotasAbiertas(abiertas);
        if (abiertas && matchMedia(SIN_LUGAR_PARA_LAS_DOS).matches) establecerBandejaAbierta(false);
    }, []);

    const guardar = async (id: number, datos: TareaPayload) => {
        try {
            await actualizarTareaCampos(id, datos);
        } catch (e: unknown) {
            console.error("Error al guardar la tarea:", e);
            toast.error("No se pudo guardar el cambio");
        }
    };
    const crear = async (payload: TareaPayload, enLaSala = false) => {
        try {
            await crearTarea(payload, enLaSala ? "sala" : "personal");
            if (!enLaSala) {
                const tema = temas.find((t) => t.id === payload.topic_id)?.name ?? "General";
                const kind = payload.kind ?? "tarea";
                toast.success(`${INFO_TIPO[kind].uno} ${kind === "tarea" ? "creada" : "creado"} en ${tema}`);
            }
        } catch (e: unknown) {
            console.error("Error al crear la tarea:", e);
            toast.error("No se pudo crear");
        }
    };
    const alternarHecha = (t: Tarea) => void guardar(t.id, { status: t.status === "Completada" ? "Sin Empezar" : "Completada" });
    const marcarHecha = (t: Tarea) => {
        void guardar(t.id, { status: "Completada" });
        const vuelve = soltar();
        toast(vuelve ? `Hecha. Volvés a ${vuelve.header.split(" — ")[0]}` : "Hecha. Elegí lo que sigue");
    };
    const cambiarChecklist = (t: Tarea, checklist: ItemChecklist[]) => {
        void guardar(t.id, { checklist });
        if (checklist.every((i) => i.hecho) && !t.checklist?.every((i) => i.hecho)) {
            const tipo = tipoDe(t);
            toast(tipo === "informe" ? "Informe listo para entregar" : tipo === "parcial" ? "Repasaste todas las unidades" : `${t.header.split(" — ")[0]}: están todos los puntos`);
        }
    };
    const autorDe = (t: Tarea) =>
        t.user_id === usuario?.id ? "Vos" : (usuariosEnSala.find((u) => u.id === t.user_id)?.name ?? "Alguien que ya no está");

    // El detalle técnico va a la consola; en pantalla, la columna de errores
    if (error) {
        return (
            <div className="flex min-h-dvh flex-col">
                <EncabezadoApp />
                <EstadoColumna
                    icono={DoorClosed}
                    titulo="No encontramos esta sala"
                    texto="Puede que el link esté mal copiado o que la sala se haya cerrado."
                >
                    <button type="button" onClick={crearSala} disabled={creando} className={claseBotonAcento}>
                        {creando ? "Creando…" : "Crear una sala"}
                    </button>
                    <LineaLink etiqueta="¿Te pasaron otro link?" onUnirse={unirse} />
                </EstadoColumna>
            </div>
        );
    }

    return (
        <div data-quieto={quieto || undefined} className="sala @container flex min-h-dvh flex-col overflow-x-clip">
            <CabeceraSala usuariosEnSala={usuariosEnSala} />

            <main className="flex min-w-0 flex-1 flex-col items-center justify-center px-4 pt-6 pb-[6.5rem]">
                {cargandoInvitacion ? (
                    <CargaArco texto="Entrando a la sala…" />
                ) : (
                    // I · Sube sin achicarse: con la bandeja abierta, el reloj se corre hacia arriba
                    <div className={cn("w-full transition-transform duration-[550ms] ease-[cubic-bezier(.16,1,.3,1)]", bandejaAbierta && "-translate-y-[min(22cqh,10rem)]")}>
                        <TimerDisplay enlace={enlaceInvitacion || ""} codigo={invitacion?.code || ""} salaId={salaIdValida} enLaSala={Math.max(1, usuariosEnSala.length)} />
                    </div>
                )}
            </main>

            <BandejaTareas
                tareas={mias}
                temas={temas}
                abierta={bandejaAbierta}
                onAbrir={abrirBandeja}
                foco={foco}
                onEnfocar={enfocar}
                onSoltar={soltar}
                onMarcarHecha={marcarHecha}
                onCambiarChecklist={cambiarChecklist}
                onCrear={(p) => void crear(p)}
                pendientesExtra={deLaSala.filter(estaPendiente).length}
                nuevas={nuevas}
                className="max-h-[52dvh]"
                arriba={
                    <PestanasTareas
                        ambito={ambito}
                        mias={mias.filter(estaPendiente).length}
                        deLaSala={deLaSala.filter(estaPendiente).length}
                        nuevas={nuevas}
                        onAmbito={(a) => {
                            establecerAmbito(a);
                            if (a === "sala") establecerVistoHasta(new Date().toISOString());
                        }}
                    />
                }
                cuerpo={
                    ambito === "sala" ? (
                        <TareasDeLaSala
                            tareas={deLaSala}
                            autorDe={autorDe}
                            onCrear={(header) => void crear({ header }, true)}
                            onAlternarHecha={alternarHecha}
                        />
                    ) : undefined
                }
            />

            <BandejaNotas
                notas={notas}
                temas={temas}
                abierta={notasAbiertas}
                onAbrir={abrirNotas}
                onAgregar={(texto) => agregar(texto, NOMBRE_FASE[modo])}
                onQuitar={quitar}
                onBorrarTodas={borrarTodas}
                onPonerTema={ponerTema}
            />
        </div>
    );
};

export default RoomPage;
