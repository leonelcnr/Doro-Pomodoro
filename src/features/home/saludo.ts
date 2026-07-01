// Devuelve el saludo apropiado según la hora del día (mañana, tarde o noche).
// Se usa en el hero de la página de inicio para personalizar la bienvenida.
export function obtenerSaludo(fecha: Date = new Date()): string {
    const hora = fecha.getHours();
    if (hora >= 6 && hora < 13) return "Buenos días";
    if (hora >= 13 && hora < 20) return "Buenas tardes";
    return "Buenas noches";
}

// Formatea una fecha como hora de reloj de 24h ("14:32"). Se usa en la franja
// de saludo del header de inicio.
export function formatearHora(fecha: Date = new Date()): string {
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    return `${horas}:${minutos}`;
}

// Formatea una cantidad de minutos a un texto compacto ("45m", "2h", "2h10").
// Pensado para el centro del anillo de enfoque, donde el espacio es reducido.
export function formatearMinutosCompacto(minutos: number): string {
    if (minutos < 60) return `${minutos}m`;
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    return resto === 0 ? `${horas}h` : `${horas}h${resto}`;
}
