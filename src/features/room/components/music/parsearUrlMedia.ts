// Utilidades para parsear enlaces de YouTube/Spotify y convertirlos en URLs
// embebibles (iframe). Las regex se mantienen a nivel de módulo (se compilan una
// sola vez) y los nombres de proveedor van en inglés porque son parte de la URL.

const REGEX_YOUTUBE = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
const REGEX_SPOTIFY = /^(?:https?:\/\/)?(?:open\.)?spotify\.com\/(track|album|playlist|episode)\/([a-zA-Z0-9]+)(?:\?.*)?$/;

// Convierte un enlace de YouTube en su URL embebida (o null si no es válido)
export function parsearYoutube(url: string): string | null {
    const coincidencia = url.match(REGEX_YOUTUBE);
    if (coincidencia && coincidencia[1]) {
        return `https://www.youtube.com/embed/${coincidencia[1]}?autoplay=1`;
    }
    return null;
}

// Convierte un enlace de Spotify en su URL embebida (o null si no es válido)
export function parsearSpotify(url: string): string | null {
    const coincidencia = url.match(REGEX_SPOTIFY);
    if (coincidencia && coincidencia[1] && coincidencia[2]) {
        return `https://open.spotify.com/embed/${coincidencia[1]}/${coincidencia[2]}?utm_source=generator&theme=0`;
    }
    return null;
}

// Para el reproductor local: acepta YouTube o Spotify y devuelve la URL embebida
// (o null si no coincide con ninguno).
export function parsearUrlMedia(url: string): string | null {
    return parsearYoutube(url) ?? parsearSpotify(url);
}
