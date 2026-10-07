// Fechas escritas como en los bocetos: «vie 9/10», y el aviso «jue 8/10 18:00».

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** «vie 9/10» de una fecha ISO ("2026-10-09"), sin pasar por UTC. */
export function fechaLarga(fechaISO: string): string {
    const [a, m, d] = fechaISO.split("-").map(Number);
    const f = new Date(a!, m! - 1, d!);
    return `${DIAS[f.getDay()]} ${f.getDate()}/${f.getMonth() + 1}`;
}

/** «jue 8/10 18:00» de un instante ISO, en hora local. */
export function horaAviso(instante: string): string {
    const f = new Date(instante);
    const hh = String(f.getHours()).padStart(2, "0");
    const mm = String(f.getMinutes()).padStart(2, "0");
    return `${DIAS[f.getDay()]} ${f.getDate()}/${f.getMonth() + 1} ${hh}:${mm}`;
}
