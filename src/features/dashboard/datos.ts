// Cuentas del dashboard (boceto aprobado: 3 · Resumen, Estudio y Tareas). Todo puro:
// recibe los agregados de la RPC y las tareas, y devuelve lo que dibujan las piezas.
// `dias[i]` es «hace i días» (0 = hoy), como en el boceto.

import { tipoDe } from "@/features/tasks/avance";
import { diasHasta, estaPendiente } from "@/features/tasks/bandeja";
import { fechaLocalISO, sumarDias } from "@/features/tasks/calendario";
import type { Tarea, TipoItem } from "@/types/dominio";

export interface Agregados {
    hourly: { stat_date: string; stat_hour: number; total_minutes: number }[];
    daily: { stat_date: string; total_minutes: number; sessions_count: number }[];
}

export interface Dia {
    i: number;
    iso: string;
    fecha: Date;
    /** 0 = lunes … 6 = domingo */
    dow: number;
    minutos: number;
    sesiones: number;
    porHora: number[];
}

export type Periodo = "semana" | "mes" | "ano";
export const LARGO: Record<Periodo, number> = { semana: 7, mes: 30, ano: 365 };
export const OFF_MAX: Record<Periodo, number> = { semana: 52, mes: 12, ano: 1 };
const N_DIAS = 2 * 365 + 7;

const deISO = (iso: string) => {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(a!, m! - 1, d!);
};

/** Un día por casillero, de hoy para atrás, con los minutos y los minutos por hora. */
export function construirDias(agregados: Agregados | null | undefined, hoy: string): Dia[] {
    const indice = new Map<string, number>();
    const dias: Dia[] = Array.from({ length: N_DIAS }, (_, i) => {
        const iso = sumarDias(hoy, -i);
        const fecha = deISO(iso);
        indice.set(iso, i);
        return { i, iso, fecha, dow: (fecha.getDay() + 6) % 7, minutos: 0, sesiones: 0, porHora: Array(24).fill(0) };
    });
    for (const f of agregados?.daily ?? []) {
        const i = indice.get(f.stat_date);
        if (i != null) {
            dias[i]!.minutos += f.total_minutes;
            dias[i]!.sesiones += f.sessions_count;
        }
    }
    for (const f of agregados?.hourly ?? []) {
        const i = indice.get(f.stat_date);
        if (i != null && f.stat_hour >= 0 && f.stat_hour < 24) dias[i]!.porHora[f.stat_hour] += f.total_minutes;
    }
    return dias;
}

/* ── Formato ── */
export const fmt = (m: number) => {
    m = Math.round(m);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h} h ${r} min` : `${h} h`;
};
export const fmtCorto = (m: number) => {
    m = Math.round(m);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), r = m % 60;
    return r ? `${h} h ${r}` : `${h} h`;
};
export const fmtEje = (m: number) => (m < 60 ? `${m} min` : `${(m / 60).toLocaleString("es-AR")} h`);
export const nota = (v: number) => (Math.round(v * 10) / 10).toLocaleString("es-AR");
export const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
export const DOW_L = ["L", "M", "M", "J", "V", "S", "D"];
export const DOW_CORTO = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
export const DOW_LARGO = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábados", "domingos"];
export const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const fecha = (f: Date) => `${DOW_CORTO[(f.getDay() + 6) % 7]} ${f.getDate()} ${MESES[f.getMonth()]}`;
export const fechaCorta = (f: Date, conAno = false) => `${f.getDate()} ${MESES[f.getMonth()]}${conAno ? ` ${f.getFullYear()}` : ""}`;
export const enDias = (d: number) => (d === 0 ? "Hoy" : d === 1 ? "Mañana" : d < 0 ? `Hace ${-d} días` : `En ${d} días`);

/* ── Meta ── */
export const nivelMeta = (m: number, meta: number) => (!m ? 0 : m < meta / 2 ? 1 : m < meta ? 2 : 4);

export function contar(dias: Dia[], meta: number) {
    const cumple = (i: number) => (dias[i]?.minutos ?? 0) >= meta;
    const suma = (a: number, b: number) => dias.slice(a, b + 1).reduce((s, d) => s + d.minutos, 0);
    const cumplidos = (a: number, b: number) => dias.slice(a, b + 1).filter((d) => d.minutos >= meta).length;
    const racha = () => {
        let i = cumple(0) ? 0 : 1, r = 0;
        while (i < dias.length && cumple(i)) { r++; i++; }
        return r;
    };
    const mejorRacha = () => {
        let m = 0, r = 0;
        for (let i = 364; i >= 0; i--) { r = cumple(i) ? r + 1 : 0; m = Math.max(m, r); }
        return m;
    };
    return { cumple, suma, cumplidos, racha, mejorRacha };
}

/* ── Períodos: [más nuevo, más viejo] en «hace i días» ── */
export const rango = (per: Periodo, off = 0): [number, number] => {
    const n = LARGO[per];
    return [off * n, off * n + n - 1];
};

export function textos(per: Periodo, off: number, dias: Dia[]) {
    const [a, b] = rango(per, off), ano = per === "ano";
    const t = {
        semana: ["Esta semana", "esta semana", "esa semana", "la semana anterior", "La anterior", "Semana"],
        mes: ["Últimos 30 días", "en estos 30 días", "en esos 30 días", "los 30 anteriores", "Los 30 anteriores", "30 días"],
        ano: ["Último año", "en el último año", "en ese año", "el año anterior", "El anterior", "Año"],
    }[per];
    return {
        titulo: off ? t[5]! : t[0]!,
        fechas: `del ${fechaCorta(dias[b]!.fecha, ano)} al ${fechaCorta(dias[a]!.fecha, ano)}`,
        en: off ? t[2]! : t[1]!,
        ant: t[3]!,
        antCap: t[4]!,
    };
}
export type Textos = ReturnType<typeof textos>;

export function cifrasPer(dias: Dia[], meta: number, per: Periodo, off: number) {
    const c = contar(dias, meta);
    const [a, b] = rango(per, off), [a2, b2] = rango(per, off + 1), n = b - a + 1;
    const total = c.suma(a, b), antes = c.suma(a2, b2);
    return { a, b, n, total, antes, dif: total - antes, c: c.cumplidos(a, b), cAnt: c.cumplidos(a2, b2), prom: total / n };
}
export type Cifras = ReturnType<typeof cifrasPer>;

/* ── Cuándo: minutos por día de la semana y hora (7 a 24), en promedio por semana ── */
export const H0 = 7, H1 = 24, HORAS = H1 - H0;
export function horario(dias: Dia[], a: number, b: number) {
    const sem = (b - a + 1) / 7;
    const dh = Array.from({ length: 7 }, () => Array<number>(HORAS).fill(0));
    for (let i = a; i <= b; i++) {
        const d = dias[i]!;
        for (let k = 0; k < HORAS; k++) dh[d.dow]![k]! += d.porHora[k + H0]! / sem;
    }
    const porHora = Array.from({ length: HORAS }, (_, k) => dh.reduce((x, f) => x + f[k]!, 0));
    const porDow = dh.map((f) => f.reduce((x, y) => x + y, 0));
    const mejorDow = porDow.indexOf(Math.max(...porDow));
    let mejor = 0, at = 0;
    for (let k = 0; k + 3 <= HORAS; k++) {
        const v = porHora[k]! + porHora[k + 1]! + porHora[k + 2]!;
        if (v > mejor) { mejor = v; at = k; }
    }
    const total = porHora.reduce((x, y) => x + y, 0);
    return { porHora, mejorDow, ventana: at + H0, share: total ? Math.round((mejor / total) * 100) : 0, hay: total > 0 };
}
export type Horario = ReturnType<typeof horario>;

/* ── Barras: un día por barra; en el año, el promedio por día de cada mes ── */
export interface Barra {
    v: number;
    ant?: number;
    etq: string;
    tip: string;
    hoy?: boolean;
}

export const tipDia = (d: Dia, meta: number) =>
    `${d.i === 0 ? "Hoy" : fecha(d.fecha)} · ${d.minutos ? fmt(d.minutos) : "sin estudio"}${d.minutos >= meta ? " · meta cumplida" : ""}`;

export function listaPer(dias: Dia[], meta: number, per: Periodo, off: number): Barra[] {
    const [a, b] = rango(per, off);
    if (per === "ano") {
        const g: { y: number; mo: number; t: number; n: number; c: number }[] = [];
        for (let i = b; i >= a; i--) {
            const d = dias[i]!, y = d.fecha.getFullYear(), mo = d.fecha.getMonth();
            let x = g.at(-1);
            if (!x || x.y !== y || x.mo !== mo) g.push((x = { y, mo, t: 0, n: 0, c: 0 }));
            x.t += d.minutos; x.n++;
            if (d.minutos >= meta) x.c++;
        }
        if (g.length > 12) g.shift(); // el mes más viejo queda cortado: afuera, quedan 12
        return g.map((x, k) => {
            const v = x.t / x.n, enCurso = !off && k === g.length - 1;
            return { v, etq: MESES[x.mo]!, tip: `${MESES[x.mo]} ${x.y}${enCurso ? ` (en curso, ${x.n} días)` : ""} · ${fmt(v)} por día · ${x.c} de ${x.n} días con la meta`, hoy: enCurso };
        });
    }
    const n = b - a + 1;
    return Array.from({ length: n }, (_, k) => {
        const d = dias[b - k]!, ant = dias[b - k + n]?.minutos ?? 0;
        const etq = per === "semana" ? DOW_L[d.dow]! : d.fecha.getDate() % 5 === 0 || k === n - 1 ? `${d.fecha.getDate()}` : "";
        return { v: d.minutos, ant, etq, tip: tipDia(d, meta), hoy: d.i === 0 };
    });
}

/* ── Acumulado del período contra el anterior y el ritmo de la meta (en el año, por semana) ── */
export function tendencia(dias: Dia[], meta: number, per: Periodo, off: number) {
    const [a, b] = rango(per, off), largo = b - a + 1, paso = per === "ano" ? 7 : 1, n = Math.floor(largo / paso);
    const act: number[] = [], ant: number[] = [], ritmo: number[] = [], fin: Dia[] = [];
    let sa = 0, sb = 0;
    for (let k = 0; k < n; k++) {
        for (let j = 0; j < paso; j++) {
            const i = b - k * paso - j;
            sa += dias[i]!.minutos;
            sb += dias[i + largo]?.minutos ?? 0;
        }
        act.push(sa); ant.push(sb); ritmo.push(meta * (k + 1) * paso); fin.push(dias[b - k * paso - paso + 1]!);
    }
    const etq = (k: number) => {
        const d = fin[k]!;
        if (per === "semana") return DOW_L[d.dow]!;
        if (per === "mes") return (k % 7 === 0 && k < n - 3) || k === n - 1 ? `${d.fecha.getDate()}` : "";
        const m = d.fecha.getMonth();
        return (k === 0 || fin[k - 1]!.fecha.getMonth() !== m) && m % 3 === 0 ? MESES[m]! : "";
    };
    return { act, ant, ritmo, etiquetas: act.map((_, k) => etq(k)), dif: sa - sb, sa, sb };
}

/* ── Tareas del período: lo completado (por `completed_at`), entregas y parciales ── */
const ORDEN: TipoItem[] = ["practico", "informe", "parcial", "tarea"];
const U: Record<TipoItem, [string, string]> = {
    practico: ["práctico", "prácticos"], informe: ["informe", "informes"], parcial: ["parcial", "parciales"], tarea: ["tarea", "tareas"],
};
export const desglose = (x: Record<TipoItem, number>) =>
    ORDEN.filter((k) => x[k]).map((k) => `${x[k]} ${U[k][x[k] === 1 ? 0 : 1]}`).join(", ") || "nada";

/** «hace i días» de un instante o una fecha ISO, en la hora local. */
const haceDias = (instanteOFecha: string, hoy: string) => {
    const iso = instanteOFecha.length > 10 ? fechaLocalISO(new Date(instanteOFecha)) : instanteOFecha;
    return -(diasHasta(iso, hoy) ?? 0);
};

export function tareasPer(tareas: Tarea[], hoy: string, per: Periodo, off: number) {
    const [a, b] = rango(per, off), [a2, b2] = rango(per, off + 1);
    const vacio = (): Record<TipoItem, number> => ({ practico: 0, informe: 0, parcial: 0, tarea: 0 });
    const hechasPorDia = new Map<number, Record<TipoItem, number>>();
    const hechas = tareas.filter((t) => t.completed_at).map((t) => ({ t, i: haceDias(t.completed_at!, hoy) }));
    for (const { t, i } of hechas) {
        const r = hechasPorDia.get(i) ?? vacio();
        r[tipoDe(t)]++;
        hechasPorDia.set(i, r);
    }
    const sumar = (x: number, y: number) => {
        const r = vacio();
        for (let i = x; i <= y; i++) { const d = hechasPorDia.get(i); if (d) ORDEN.forEach((k) => (r[k] += d[k])); }
        return r;
    };
    const por = sumar(a, b), ant = sumar(a2, b2);
    const total = (r: Record<TipoItem, number>) => ORDEN.reduce((s, k) => s + r[k], 0);

    // Entregas: prácticos e informes terminados; a tiempo si se completaron hasta el día de entrega
    const entregas = hechas
        .filter(({ t }) => ["practico", "informe"].includes(tipoDe(t)))
        .map(({ t, i }) => ({ t, i, aTiempo: !t.due_date || haceDias(t.due_date, hoy) <= i }));
    const ent = entregas.filter((e) => e.i >= a && e.i <= b).sort((x, y) => y.i - x.i);
    const entAnt = entregas.filter((e) => e.i >= a2 && e.i <= b2);

    // Parciales rendidos con nota, por la fecha del parcial
    const rendidos = tareas
        .filter((t) => tipoDe(t) === "parcial" && t.grade != null && t.due_date)
        .map((t) => ({ t, i: haceDias(t.due_date!, hoy), nota: t.grade! }))
        .filter((e) => e.i >= 0);
    const rend = rendidos.filter((e) => e.i >= a && e.i <= b).sort((x, y) => y.i - x.i);
    const rAnt = rendidos.filter((e) => e.i >= a2 && e.i <= b2);

    const pend = tareas.filter(estaPendiente);
    const conFecha = pend.filter((t) => t.due_date).sort((x, y) => (diasHasta(x.due_date) ?? 0) - (diasHasta(y.due_date) ?? 0));
    return {
        a, b, por, ant, tot: total(por), totAnt: total(ant), hechasPorDia,
        ent, entAnt, aT: ent.filter((e) => e.aTiempo).length, aTAnt: entAnt.filter((e) => e.aTiempo).length,
        rend, rendidos, prom: rAnt.length ? rAnt.reduce((s, e) => s + e.nota, 0) / rAnt.length : null,
        pend, venc7: conFecha.filter((t) => (diasHasta(t.due_date) ?? 99) <= 7).length,
        proximas: conFecha,
        proxParcial: conFecha.find((t) => tipoDe(t) === "parcial"),
    };
}
export type TareasPer = ReturnType<typeof tareasPer>;

/** Lo completado por día (o por mes, en el año). */
export function listaHechas(dias: Dia[], t: TareasPer, per: Periodo, off: number): Barra[] {
    const [a, b] = rango(per, off);
    const tot = (i: number) => { const d = t.hechasPorDia.get(i); return d ? ORDEN.reduce((s, k) => s + d[k], 0) : 0; };
    if (per === "ano") {
        const g: { y: number; mo: number; t: number }[] = [];
        for (let i = b; i >= a; i--) {
            const f = dias[i]!.fecha, y = f.getFullYear(), mo = f.getMonth();
            let x = g.at(-1);
            if (!x || x.y !== y || x.mo !== mo) g.push((x = { y, mo, t: 0 }));
            x.t += tot(i);
        }
        if (g.length > 12) g.shift();
        return g.map((x, k) => ({ v: x.t, etq: MESES[x.mo]!, tip: `${MESES[x.mo]} ${x.y} · ${x.t} cosas hechas`, hoy: !off && k === g.length - 1 }));
    }
    const n = b - a + 1;
    return Array.from({ length: n }, (_, k) => {
        const i = b - k, d = dias[i]!;
        const r = t.hechasPorDia.get(i);
        return {
            v: tot(i),
            etq: per === "semana" ? DOW_L[d.dow]! : d.fecha.getDate() % 5 === 0 || k === n - 1 ? `${d.fecha.getDate()}` : "",
            tip: `${i === 0 ? "Hoy" : fecha(d.fecha)} · ${r ? desglose(r) : "nada"}`,
            hoy: i === 0,
        };
    });
}
