// Las clases de los controles que rodean el reloj de la sala: botones de 40 px sin
// borde que se marcan al pasar, y los paneles chicos (música, tiempos) pegados a ellos.

/** Un control del reloj (compartir, música, reiniciar, ventana, tiempos). */
export const claseControl =
    "relative grid size-10 shrink-0 place-items-center rounded-[0.625rem] border border-transparent text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-muted aria-expanded:text-foreground [&_svg]:size-[1.1875rem]";

/** El panel que se abre pegado a un control. */
export const clasePanel =
    "w-[min(20rem,calc(100vw-2rem))] rounded-[0.875rem] border bg-card px-4 pt-3.5 pb-4 text-left text-[0.9375rem] leading-normal shadow-lg";

/** El rótulo en mayúsculas chicas de un panel o de una de sus partes. */
export const claseRotulo = "text-[0.6875rem] font-medium tracking-[0.15em] text-muted-foreground uppercase";
