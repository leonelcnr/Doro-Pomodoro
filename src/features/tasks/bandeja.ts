// Lógica de la bandeja de tareas (T43 · Línea de tiempo), la misma pieza en el home
// y en la sala: qué está pendiente, cuántos días faltan, cómo se escribe el día y
// cómo nace la checklist de un práctico, un informe o un parcial.

import { avanceItem, estaTerminado, tipoDe } from "./avance";
import { fechaLocalISO } from "./calendario";
import type { ItemChecklist, Tarea, TipoItem } from "@/types/dominio";

export interface InfoTipo {
    nombre: string;
    uno: string;
    /** Cómo se llaman las marcas de su checklist (null en las tareas sueltas). */
    marcas: string | null;
}

export const INFO_TIPO: Record<TipoItem, InfoTipo> = {
    parcial: { nombre: "Parciales", uno: "Parcial", marcas: "unidades" },
    practico: { nombre: "Prácticos", uno: "Práctico", marcas: "puntos" },
    informe: { nombre: "Informes", uno: "Informe", marcas: "partes" },
    tarea: { nombre: "Tareas", uno: "Tarea", marcas: null },
};

/** «Nueva tarea», «Nuevo práctico»… */
export const nuevoDe = (tipo: TipoItem) =>
    tipo === "tarea" ? "Nueva tarea" : `Nuevo ${INFO_TIPO[tipo].uno.toLowerCase()}`;

/** Días desde hoy hasta la fecha ISO (negativo si ya pasó); null sin fecha. */
export function diasHasta(fechaISO: string | null | undefined, hoy = fechaLocalISO(new Date())): number | null {
    if (!fechaISO) return null;
    const [a, m, d] = fechaISO.split("-").map(Number);
    const [ha, hm, hd] = hoy.split("-").map(Number);
    return Math.round((Date.UTC(a!, m! - 1, d!) - Date.UTC(ha!, hm! - 1, hd!)) / 864e5);
}

/** Un parcial cuya fecha ya pasó está rendido: deja de estar pendiente. */
export const estaRendido = (tarea: Tarea) => {
    const d = diasHasta(tarea.due_date);
    return tipoDe(tarea) === "parcial" && d != null && d < 0;
};

export const estaPendiente = (tarea: Tarea) => !estaTerminado(tarea) && !estaRendido(tarea);

/** Lo pendiente por fecha de proximidad; lo sin fecha al final, y a igual día por tipo. */
const ORDEN_TIPO: Record<TipoItem, number> = { parcial: 0, practico: 1, informe: 2, tarea: 3 };
export function porProximidad(tareas: Tarea[]): Tarea[] {
    return [...tareas].sort(
        (a, b) =>
            (diasHasta(a.due_date) ?? 999) - (diasHasta(b.due_date) ?? 999) ||
            ORDEN_TIPO[tipoDe(a)] - ORDEN_TIPO[tipoDe(b)]
    );
}

const DIAS_SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const fechaDe = (dias: number) => {
    const f = new Date();
    f.setDate(f.getDate() + dias);
    return { semana: DIAS_SEMANA[f.getDay()]!, dia: `${f.getDate()}/${f.getMonth() + 1}` };
};

/** «hoy», «mañana», «en 4 días», «hace 2 días». */
export function relativo(dias: number): string {
    if (dias === 0) return "hoy";
    if (dias === 1) return "mañana";
    if (dias === -1) return "ayer";
    return dias > 1 ? `en ${dias} días` : `hace ${-dias} días`;
}

/** El día en la línea de tiempo: «hoy», «mañana», «vie» esta semana y «16/10» después. */
export function cuandoCorto(dias: number | null): string {
    if (dias == null) return "";
    if (dias === 0) return "hoy";
    if (dias === 1) return "mañana";
    if (dias === -1) return "ayer";
    if (dias < 0) return `hace ${-dias} d`;
    const { semana, dia } = fechaDe(dias);
    return dias < 7 ? semana : dia;
}

/** Avance de la checklist (null si no tiene: tareas sueltas o un parcial sin unidades). */
export function marcasDe(tarea: Tarea): [number, number] | null {
    if (!tarea.checklist?.length) return null;
    const { hechos, total } = avanceItem(tarea);
    return [hechos, total];
}

/** La checklist con la que nace un práctico (puntos), un informe (partes) o un parcial (unidades). */
export function checklistInicial(tipo: TipoItem, cantidad: number): ItemChecklist[] | undefined {
    if (tipo === "tarea") return undefined;
    const nombre = tipo === "practico" ? "Punto" : tipo === "informe" ? "Parte" : "Unidad";
    return Array.from({ length: cantidad }, (_, i) => ({
        id: crypto.randomUUID(),
        texto: `${nombre} ${i + 1}`,
        hecho: false,
    }));
}
