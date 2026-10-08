import { useLayoutEffect, useRef, type DependencyList } from "react"

/**
 * Cuando cambian `dependencias` y el elemento cambia de alto, en lugar del salto anima
 * desde el alto anterior al nuevo. Lo de adentro se recorta mientras dura.
 */
export function useAnimarAlto<T extends HTMLElement>(dependencias: DependencyList, activo = true) {
    const ref = useRef<T>(null)
    const altoPrevio = useRef(0)

    useLayoutEffect(() => {
        const el = ref.current
        if (!el) return
        const alto = el.offsetHeight
        const antes = altoPrevio.current
        altoPrevio.current = alto
        if (!activo || !antes || antes === alto || matchMedia("(prefers-reduced-motion: reduce)").matches) return
        el.style.overflow = "clip"
        el.animate([{ height: `${antes}px` }, { height: `${alto}px` }], { duration: 380, easing: "cubic-bezier(.16,1,.3,1)" })
            .finished.catch(() => {})
            .finally(() => (el.style.overflow = ""))
        // eslint-disable-next-line react-hooks/exhaustive-deps -- las dependencias las elige quien llama
    }, dependencias)

    return ref
}
