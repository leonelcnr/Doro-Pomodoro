import { useState } from "react"
import { toast } from "sonner"
import { EncabezadoApp } from "@/components/encabezado/EncabezadoApp"
import { TIPOS_ITEM, fraccion, itemsDelTema, sumarAvance, tipoDe } from "@/features/tasks/avance"
import { INFO_TIPO, diasHasta, estaPendiente } from "@/features/tasks/bandeja"
import { frase, fraseCorta, pendienteDe } from "@/features/tasks/frases"
import { transicionCaja } from "@/features/tasks/transicionCaja"
import { CabeceraTareas, type VistaTareas } from "@/features/tasks/components/pantalla/CabeceraTareas"
import { CajaAbierta, type OpcionCaja } from "@/features/tasks/components/pantalla/CajaAbierta"
import { CajaTema, NuevoTema } from "@/features/tasks/components/pantalla/CajaTema"
import { CalendarioTareas, type FilaCalendario } from "@/features/tasks/components/pantalla/CalendarioTareas"
import { DetalleItem } from "@/features/tasks/components/pantalla/DetalleItem"
import { useTareas } from "@/features/tasks/hooks/useTareas"
import { useTemas } from "@/features/tasks/hooks/useTemas"
import { useAuth } from "@/features/auth/context/useAuth"
import { cn } from "@/lib/utils"
import type { IconoTema, Tarea, TareaPayload, TipoItem } from "@/types/dominio"

const porcentajeDe = (items: Tarea[]) => Math.round(fraccion(sumarAvance(items)) * 100)
const claveDe = (temaId: string | null) => temaId ?? "general"

/** Al abrir un tema se ve el tipo con lo más próximo; si no hay fechas, el primero que tenga algo. */
function tipoInicial(items: Tarea[]): TipoItem {
    const proximo = items
        .filter((t) => estaPendiente(t) && t.due_date)
        .sort((a, b) => (diasHasta(a.due_date) ?? 0) - (diasHasta(b.due_date) ?? 0))[0]
    return proximo ? tipoDe(proximo) : (TIPOS_ITEM.find((t) => items.some((i) => tipoDe(i) === t)) ?? "tarea")
}

/**
 * Tareas (S2 · El nombre elige el tema): la frase de lo que queda, la barra y
 * «Temas | Calendario»; debajo, las cajas de los temas. Una caja se abre sola en su
 * lugar y el detalle de lo que se toca sale desde la esquina.
 */
const TareasPage = () => {
    const { tareas, cargado, crearTarea, actualizarTareaCampos } = useTareas()
    const { temas, cargado: temasCargados, crearTema } = useTemas()
    const { user, cargando } = useAuth()
    // Sin cuenta todavía no hay nada que cargar; con cuenta, se espera a tareas y temas
    // para no mostrar «Estás al día» un instante antes de que lleguen.
    const listo = !cargando && (!user || (cargado && temasCargados))
    const [vista, establecerVista] = useState<VistaTareas>("temas")
    // undefined: la grilla; null: «General»; si no, el id del tema abierto
    const [abierto, establecerAbierto] = useState<string | null | undefined>(undefined)
    const [tipo, establecerTipo] = useState<TipoItem>("tarea")
    const [elegido, establecerElegido] = useState<number | null>(null)

    const sinTema = itemsDelTema(tareas, null)
    const cajas: (OpcionCaja & { items: Tarea[] })[] = [
        ...temas.map((t) => {
            const items = itemsDelTema(tareas, t.id)
            return { temaId: t.id, nombre: t.name, icono: t.icon as IconoTema | "bandeja", porcentaje: porcentajeDe(items), items }
        }),
        ...(sinTema.length || abierto === null
            ? [{ temaId: null, nombre: "General", icono: "bandeja" as const, porcentaje: porcentajeDe(sinTema), items: sinTema }]
            : []),
    ]
    const caja = abierto === undefined ? undefined : cajas.find((c) => c.temaId === abierto)
    const tareaElegida = tareas.find((t) => t.id === elegido)
    const nombreTema = (t: Tarea) => temas.find((x) => x.id === t.topic_id)?.name ?? "General"

    const abrir = (temaId: string | null, desde: Element | null) =>
        transicionCaja(
            desde,
            () => {
                establecerAbierto(temaId)
                establecerElegido(null)
                establecerTipo(tipoInicial(itemsDelTema(tareas, temaId)))
            },
            () => document.querySelector("[data-abierta]"),
            true,
        )
    const cerrar = () => {
        const clave = claveDe(abierto ?? null)
        transicionCaja(
            document.querySelector("[data-abierta]"),
            () => {
                establecerAbierto(undefined)
                establecerElegido(null)
            },
            () => document.querySelector(`[data-caja="${clave}"]`),
            false,
        )
    }

    const guardar = async (id: number, datos: TareaPayload) => {
        try {
            await actualizarTareaCampos(id, datos)
        } catch (error: unknown) {
            console.error("Error al guardar la tarea:", error)
            toast.error("No se pudo guardar el cambio")
        }
    }
    const crear = async (payload: TareaPayload) => {
        try {
            await crearTarea(payload, "personal")
        } catch (error: unknown) {
            console.error("Error al crear:", error)
            toast.error(`No se pudo crear ${payload.kind === "tarea" ? "la tarea" : `el ${INFO_TIPO[payload.kind ?? "tarea"].uno.toLowerCase()}`}`)
        }
    }
    const alternarHecha = (t: Tarea) => void guardar(t.id, { status: t.status === "Completada" ? "Sin Empezar" : "Completada" })
    const nuevoTema = async (nombre: string, icono: IconoTema) => {
        try {
            await crearTema(nombre, icono)
        } catch (error: unknown) {
            console.error("Error al crear el tema:", error)
            toast.error("No se pudo crear el tema")
        }
    }

    const filasCalendario: FilaCalendario[] = caja
        ? (["parcial", "practico", "informe", "tarea"] as const).map((t) => ({ clave: t, nombre: INFO_TIPO[t].nombre, icono: { tipo: t }, items: caja.items.filter((i) => tipoDe(i) === t) }))
        : cajas.map((c) => ({ clave: claveDe(c.temaId), nombre: c.nombre, icono: { tema: c.icono }, items: c.items })).filter((f) => f.items.length)
    const enCalendario = vista === "calendario"

    return (
        <div className="flex min-h-dvh flex-col">
            <EncabezadoApp />
            {/* Márgenes del boceto: crecen con el ancho (40 a 120 px) desde 720 px */}
            <main className="@container flex flex-1 flex-col px-5 pt-8 pb-16 min-[45rem]:px-[clamp(2.5rem,7vw,7.5rem)] min-[45rem]:pt-11 min-[45rem]:pb-20" aria-busy={!listo}>
                {listo && (
                <div className={cn("flex w-full flex-col gap-9", enCalendario && !caja ? "mb-auto" : "m-auto max-w-[67.5rem]", caja && "gap-[1.125rem]")}>
                    <CabeceraTareas frase={frase(pendienteDe(tareas))} porcentaje={porcentajeDe(tareas)} vista={vista} onVista={establecerVista} ancha={enCalendario && !caja} />

                    {caja ? (
                        <CajaAbierta
                            tema={caja}
                            opciones={cajas}
                            frase={fraseCorta(pendienteDe(caja.items))}
                            items={caja.items}
                            tipo={tipo}
                            itemElegido={elegido}
                            onTipo={establecerTipo}
                            onElegirTema={(id) => {
                                establecerAbierto(id)
                                establecerElegido(null)
                                establecerTipo(tipoInicial(itemsDelTema(tareas, id)))
                            }}
                            onCerrar={cerrar}
                            onAbrirItem={(t) => establecerElegido(t.id)}
                            onAlternarHecha={alternarHecha}
                            onCrear={crear}
                            calendario={enCalendario ? <CalendarioTareas filas={filasCalendario} elegido={elegido} onAbrir={(t) => establecerElegido(t.id)} /> : undefined}
                        />
                    ) : enCalendario ? (
                        <CalendarioTareas filas={filasCalendario} elegido={elegido} onAbrir={(t) => establecerElegido(t.id)} />
                    ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,14.5rem),1fr))] gap-3.5">
                            {cajas.map((c) => (
                                <CajaTema
                                    key={claveDe(c.temaId)}
                                    clave={claveDe(c.temaId)}
                                    nombre={c.nombre}
                                    icono={c.icono}
                                    porcentaje={c.porcentaje}
                                    frase={fraseCorta(pendienteDe(c.items))}
                                    items={c.items}
                                    onAbrir={() => abrir(c.temaId, document.querySelector(`[data-caja="${claveDe(c.temaId)}"]`))}
                                />
                            ))}
                            <NuevoTema onCrear={nuevoTema} />
                        </div>
                    )}
                </div>
                )}
            </main>

            {tareaElegida && (
                <DetalleItem
                    key={tareaElegida.id}
                    tarea={tareaElegida}
                    nombreTema={nombreTema(tareaElegida)}
                    onCerrar={() => establecerElegido(null)}
                    onCambiar={(datos) => void guardar(tareaElegida.id, datos)}
                    onAlternarHecha={alternarHecha}
                />
            )}
        </div>
    )
}

export default TareasPage
