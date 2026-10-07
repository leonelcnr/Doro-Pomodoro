// Convierte un enlace de YouTube en la URL embebida (iframe) del video de la sala.
// La regex se compila una sola vez, a nivel de módulo.

const REGEX_YOUTUBE = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;

// Convierte un enlace de YouTube en su URL embebida (o null si no es válido)
export function parsearYoutube(url: string): string | null {
    const coincidencia = url.match(REGEX_YOUTUBE);
    if (coincidencia && coincidencia[1]) {
        return `https://www.youtube.com/embed/${coincidencia[1]}?autoplay=1`;
    }
    return null;
}
