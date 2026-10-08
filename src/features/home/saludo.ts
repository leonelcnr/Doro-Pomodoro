// Utilidades de texto del home: la hora del encabezado y las duraciones del anillo.

// Formatea una fecha como hora de reloj de 24h ("14:32"). Se usa en la franja
// del encabezado.
export function formatearHora(fecha: Date = new Date()): string {
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${horas}:${minutos}`;
}

// Formatea minutos como duración legible ("45 min", "2 h", "1 h 30"). Se usa
// en el anillo del home: "45 min de 2 h hoy".
export function formatearDuracion(total: number): string {
    const minutos = Math.round(total);
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return resto === 0 ? `${horas} h` : `${horas} h ${resto}`;
}
