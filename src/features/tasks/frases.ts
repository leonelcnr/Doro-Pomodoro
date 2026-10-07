// Las frases de la pantalla de Tareas: «Te quedan 3 parciales / 22 puntos, 3 informes
// y 5 tareas.» Cuentan lo pendiente de una lista de ítems (todo, o un tema).

import { estaTerminado, fraseFaltantes, tipoDe } from "./avance";
import { estaRendido } from "./bandeja";
import type { Tarea, TipoItem } from "@/types/dominio";

export interface Pendiente {
    parciales: number;
    puntos: number;
    informes: number;
    tareas: number;
}

const faltan = (t: Tarea) => (t.checklist ?? []).filter((i) => !i.hecho).length;

export function pendienteDe(items: Tarea[]): Pendiente {
    const p: Pendiente = { parciales: 0, puntos: 0, informes: 0, tareas: 0 };
    for (const t of items) {
        const tipo = tipoDe(t);
        if (tipo === "parcial") p.parciales += estaRendido(t) ? 0 : 1;
        else if (tipo === "practico") p.puntos += estaTerminado(t) ? 0 : faltan(t);
        else if (tipo === "informe") p.informes += estaTerminado(t) ? 0 : 1;
        else p.tareas += estaTerminado(t) ? 0 : 1;
    }
    return p;
}

/** «un parcial», «12 puntos», «3 informes», «una tarea»… sin los que están en cero. */
function partes(p: Pendiente): string[] {
    return [
        p.parciales && (p.parciales === 1 ? "un parcial" : `${p.parciales} parciales`),
        p.puntos && `${p.puntos} punto${p.puntos === 1 ? "" : "s"}`,
        p.informes && (p.informes === 1 ? "un informe" : `${p.informes} informes`),
        p.tareas && `${p.tareas === 1 ? "una" : p.tareas} tarea${p.tareas === 1 ? "" : "s"}`,
    ].filter((x): x is string => Boolean(x));
}

export const unirConY = (l: string[]) =>
    l.length <= 1 ? (l[0] ?? "") : `${l.slice(0, -1).join(", ")} y ${l[l.length - 1]}`;

const verbo = (p: Pendiente) =>
    p.parciales + p.puntos + p.informes + p.tareas === 1 ? "queda" : "quedan";

/** La frase grande, en dos renglones: el primero va fuerte y el resto, tenue. */
export function frase(p: Pendiente): { fuerte: string; resto: string } {
    const l = partes(p);
    if (!l.length) return { fuerte: "Estás al día.", resto: "" };
    const [primero, ...demas] = l;
    if (!demas.length) return { fuerte: `Te ${verbo(p)} ${primero}.`, resto: "" };
    return {
        fuerte: `Te ${verbo(p)} ${primero}`,
        resto: `${demas.length === 1 ? `y ${demas[0]}` : unirConY(demas)}.`,
    };
}

/** La frase de una caja: «Te quedan un parcial, 12 puntos y una tarea» o «Al día». */
export function fraseCorta(p: Pendiente): string {
    const l = partes(p);
    return l.length ? `Te ${verbo(p)} ${unirConY(l)}` : "Al día";
}

const n = (x: number, uno: string, varios: string) => (x === 1 ? uno : `${x} ${varios}`);

/** La línea de un recuadro por tipo: «Faltan 12 puntos en 2 prácticos», «Una pendiente»… */
export function resumenTipo(tipo: TipoItem, items: Tarea[]): string {
    const delTipo = items.filter((t) => tipoDe(t) === tipo);
    if (tipo === "parcial") {
        const r = delTipo.filter(estaRendido).length;
        const f = delTipo.length - r;
        return [f && `${f === 1 ? "Uno" : f} por rendir`, r && n(r, "uno rendido", "rendidos")]
            .filter(Boolean)
            .join(", ") || "—";
    }
    if (tipo === "practico") {
        const abiertos = delTipo.filter((t) => !estaTerminado(t));
        const p = abiertos.reduce((s, t) => s + faltan(t), 0);
        return p ? `Faltan ${p} punto${p === 1 ? "" : "s"} en ${n(abiertos.length, "un práctico", "prácticos")}` : "Todos completos";
    }
    if (tipo === "informe") {
        const p = delTipo.reduce((s, t) => s + faltan(t), 0);
        return p ? `Falta${p === 1 ? "" : "n"} ${p} parte${p === 1 ? "" : "s"}` : "Listos para entregar";
    }
    const pend = delTipo.filter((t) => !estaTerminado(t)).length;
    return pend ? n(pend, "Una pendiente", "pendientes") : "Todas hechas";
}

/** La línea del medio de una tarjeta: qué falta del práctico, del informe o del parcial. */
export function medioDe(tarea: Tarea): string {
    const lista = tarea.checklist ?? [];
    const hechos = lista.filter((i) => i.hecho).length;
    const tipo = tipoDe(tarea);
    if (tipo === "parcial") {
        if (estaRendido(tarea)) return tarea.grade != null ? `Te sacaste un ${tarea.grade}` : "Anotá la nota";
        return `Repasaste ${hechos} de ${lista.length} unidades`;
    }
    if (tipo === "practico") {
        if (hechos === lista.length) return "Están todos los puntos";
        if (hechos === 0) return `Sin empezar, ${lista.length} puntos`;
        return fraseFaltantes(tarea) ?? "";
    }
    if (tipo === "informe") {
        const quedan = lista.filter((i) => !i.hecho).map((i) => `«${i.texto}»`);
        if (!quedan.length) return "Listo para entregar";
        if (quedan.length === lista.length) return `Sin empezar, ${lista.length} partes`;
        return quedan.length <= 2 ? `Falta${quedan.length === 1 ? "" : "n"} ${unirConY(quedan)}` : `Faltan ${quedan.length} de ${lista.length} partes`;
    }
    return "";
}
