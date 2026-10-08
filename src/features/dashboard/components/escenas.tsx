import type { ReactNode } from "react"
import { diasHasta, marcasDe } from "@/features/tasks/bandeja"
import { cap, desglose, enDias, fmt, fmtCorto, listaHechas, listaPer, nota, LARGO, DOW_LARGO, type Cifras, type Dia, type Horario, type Periodo, type TareasPer, type Textos } from "@/features/dashboard/datos"
import { Barras, Celda, FranjaHoy, HistHoras, PuntosPeriodo } from "./Graficos"
import type { NombreIcono } from "./Iconos"
import { B, Em, FilaProxima } from "./Tarjetas"

export interface Escena {
    id: string
    corto: string
    icono: NombreIcono
    titulo: string
    grande: string
    chico: ReactNode
    graf?: ReactNode
}

export interface Contexto {
    per: Periodo
    off: number
    T: Textos
    k: Cifras
    h: Horario
    t: TareasPer
    dias: Dia[]
    meta: number
    racha: number
    nombreTema: (topicId: string | null | undefined) => string
}

const HUECO: Record<Periodo, number> = { semana: 0.625, mes: 0.1875, ano: 0.375 }

const dif = (n: number, f: (x: number) => string) => (n === 0 ? <>lo mismo que</> : <><B>{f(Math.abs(n))} {n > 0 ? "más" : "menos"}</B> que</>)

/** Las nueve cifras del Resumen, en el orden del índice. Mirando atrás, algunas cambian. */
export function armarEscenas(x: Contexto): Escena[] {
    const { per, off, T, k, h, t, dias, meta, racha, nombreTema } = x
    const hoy = dias[0]!
    const miniHechas = <Barras lista={listaHechas(dias, t, per, off)} cuenta mini hueco={per === "mes" ? 0.125 : 0.3125} />
    const prom = t.rend.length ? t.rend.reduce((s, e) => s + e.nota, 0) / t.rend.length : 0
    const proximas = t.proximas
    const p = proximas[0]
    const unidades = (tarea: (typeof proximas)[number]) => {
        const m = marcasDe(tarea)
        return m ? `Vas ${m[0]} de ${m[1]}.` : ""
    }

    const escenas: Escena[] = [
        {
            id: "periodo", corto: "Período", icono: "tend", titulo: T.titulo, grande: fmtCorto(k.total),
            chico: <>estudiaste {T.en}, {dif(k.dif, fmt)} {T.ant}.</>,
            graf: <Barras lista={listaPer(dias, meta, per, off)} meta={meta} mini hueco={HUECO[per]} />,
        },
        off
            ? { id: "hoy", corto: "Hoy", icono: "meta", titulo: "Promedio", grande: fmtCorto(k.prom), chico: <>por día {T.en}. {T.antCap}, {fmt(k.antes / k.n)}.</>, graf: <PuntosPeriodo dias={dias} meta={meta} a={k.a} b={k.b} ano={per === "ano"} className="mx-auto max-w-[18.75rem]" /> }
            : {
                id: "hoy", corto: "Hoy", icono: "meta", titulo: "Hoy", grande: fmtCorto(hoy.minutos),
                chico: <>llevás hoy, de una meta de <B>{fmt(meta)}</B>. {meta > hoy.minutos ? <>Te falta <Em>{fmt(meta - hoy.minutos)}</Em>.</> : <Em>Ya la cumpliste.</Em>}</>,
                graf: hoy.minutos ? <FranjaHoy dia={hoy} /> : undefined,
            },
        {
            id: "constancia", corto: "Constancia", icono: "cuadros", titulo: "Constancia", grande: `${k.c} de ${k.n}`,
            chico: <>días con la meta {T.en}. {T.antCap}, {k.cAnt}.{!off && <> Llevás <Em>{racha} {racha === 1 ? "día" : "días"} seguidos</Em>.</>}</>,
            graf: <PuntosPeriodo dias={dias} meta={meta} a={k.a} b={k.b} ano={per === "ano"} className="mx-auto max-w-[18.75rem]" />,
        },
        h.hay
            ? { id: "horario", corto: "Horario", icono: "reloj", titulo: "Tu horario", grande: `${h.ventana} a ${h.ventana + 3} h`, chico: <>los <Em>{DOW_LARGO[h.mejorDow]}</Em>, cuando más rendís. Ahí arranca el <B>{h.share} %</B> de lo que estudiás.</>, graf: <HistHoras h={h} /> }
            : { id: "horario", corto: "Horario", icono: "reloj", titulo: "Tu horario", grande: "Todavía no", chico: <>hay sesiones {T.en} para saber cuándo rendís más.</> },
        {
            id: "hechas", corto: "Lo hecho", icono: "tarea", titulo: "Lo que hiciste", grande: `${t.tot}`,
            chico: <>cosas hechas {T.en}, {dif(t.tot - t.totAnt, String)} {T.ant}. {cap(desglose(t.por))}.</>,
            graf: miniHechas,
        },
        {
            id: "entregas", corto: "Entregas", icono: "check", titulo: "Entregas", grande: t.ent.length ? `${t.aT} de ${t.ent.length}` : "Ninguna",
            chico: t.ent.length ? <>entregas <Em>a tiempo</Em> {T.en}. {T.antCap}, {t.aTAnt} de {t.entAnt.length}.</> : <>entrega {T.en}.</>,
            graf: t.ent.length ? (
                <div className="flex flex-wrap justify-center gap-1">
                    {t.ent.slice().reverse().map((e) => <Celda key={e.t.id} n={e.aTiempo ? 4 : 1} tip={`${e.t.header} · ${e.aTiempo ? "a tiempo" : "tarde"}`} className="w-[1.875rem] flex-none" />)}
                </div>
            ) : undefined,
        },
        off
            ? { id: "pendiente", corto: "Ritmo", icono: "lista", titulo: "Ritmo", grande: nota(t.tot / LARGO[per]), chico: <>cosas hechas por día {T.en}. {T.antCap}, {nota(t.totAnt / LARGO[per])}.</>, graf: miniHechas }
            : { id: "pendiente", corto: "Pendiente", icono: "lista", titulo: "Pendiente", grande: `${t.pend.length}`, chico: <>cosas pendientes; <Em>{t.venc7} vencen</Em> en los próximos 7 días.</> },
        t.rend.length
            ? { id: "parciales", corto: "Parciales", icono: "parcial", titulo: "Parciales", grande: nota(prom), chico: <>de promedio en {t.rend.length} {t.rend.length === 1 ? "parcial" : "parciales"} {T.en}.</>, graf: <Barras lista={t.rend.slice().reverse().map((e) => ({ v: e.nota, etq: "", tip: `${e.t.header} · ${nota(e.nota)}` }))} cuenta mini techo={10} hueco={0.375} /> }
            : t.proxParcial && !off
              ? { id: "parciales", corto: "Parciales", icono: "parcial", titulo: "Parciales", grande: enDias(diasHasta(t.proxParcial.due_date) ?? 0), chico: <>el <B>{t.proxParcial.header.toLowerCase()}</B> de <Em>{nombreTema(t.proxParcial.topic_id)}</Em>. {unidades(t.proxParcial)}</> }
              : { id: "parciales", corto: "Parciales", icono: "parcial", titulo: "Parciales", grande: "Ninguno", chico: <>parcial {T.en}.</> },
        off
            ? { id: "prox", corto: "Lo que viene", icono: "prox", titulo: "Entregas de ese período", grande: `${t.ent.length}`, chico: <>entregas {T.en}.</> }
            : p
              ? {
                  id: "prox", corto: "Lo que viene", icono: "prox", titulo: "Lo que se viene", grande: enDias(diasHasta(p.due_date) ?? 0),
                  chico: <><B>{p.header}</B>, de <Em>{nombreTema(p.topic_id)}</Em>. {unidades(p)}</>,
                  graf: proximas.length > 1 ? <div className="flex flex-col text-left">{proximas.slice(1, 4).map((y) => <FilaProxima key={y.id} tarea={y} nombreTema={nombreTema(y.topic_id)} />)}</div> : undefined,
              }
              : { id: "prox", corto: "Lo que viene", icono: "prox", titulo: "Lo que se viene", grande: "Nada", chico: <>con fecha por delante. Lo que tenga entrega aparece acá.</> },
    ]
    return escenas
}
