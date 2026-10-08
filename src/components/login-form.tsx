import { useState } from "react"
import { cn } from "@/lib/utils"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { entrarCon, type Proveedor } from "@/features/auth/authHelpers"

// Ícono de cada proveedor, a la izquierda del botón
const ICONOS: Record<Proveedor, React.ReactNode> = {
  google: (
    <svg className="size-[1.125rem]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
  ),
  github: (
    <svg className="size-[1.125rem]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                  fill="currentColor"
                />
              </svg>
  ),
  discord: (
    <svg className="size-[1.125rem]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.14 96.36">
                <path
                  d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.08 0 72.37 72.37 0 0 0-3.36-6.83 105.15 105.15 0 0 0-26.23 8.07C2.04 33.12-2.3 57.54.91 81.54a105.21 105.21 0 0 0 32.18 14.82 72.4 72.4 0 0 0 6.91-10.87 68.32 68.32 0 0 1-10.86-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.31 68.31 0 0 1-10.87 5.19 72.4 72.4 0 0 0 6.91 10.86 105.02 105.02 0 0 0 32.18-14.82c3.55-27.4-3.14-50.41-19.34-73.47ZM42.68 65.88c-6.13 0-11.23-5.26-11.23-11.7s4.98-11.7 11.23-11.7c6.32 0 11.38 5.33 11.23 11.7 0 6.44-4.99 11.7-11.23 11.7Zm41.78 0c-6.13 0-11.23-5.26-11.23-11.7s4.98-11.7 11.23-11.7c6.32 0 11.38 5.33 11.23 11.7 0 6.44-4.99 11.7-11.23 11.7Z"
                  fill="currentColor"
                />
              </svg>
  ),
}

const PROVEEDORES: { id: Proveedor; nombre: string }[] = [
  { id: "google", nombre: "Google" },
  { id: "github", nombre: "GitHub" },
  { id: "discord", nombre: "Discord" },
]

/**
 * La única puerta de Doro (diseño final del login, «1 · Una sola puerta»). No hay
 * «crear cuenta» ni «iniciar sesión»: si la cuenta es nueva se vincula a lo que
 * se hizo sin cuenta, y si ya existía se entra a ella y se le suma lo hecho.
 */
export function LoginForm({
  conProgreso,
  volverA,
  className,
  ...props
}: React.ComponentProps<"div"> & { conProgreso: boolean; volverA: string }) {
  const [yendo, establecerYendo] = useState<Proveedor | null>(null)

  const entrar = async (proveedor: Proveedor) => {
    establecerYendo(proveedor)
    try {
      await entrarCon(proveedor, volverA)
    } catch (error: unknown) {
      console.error(error)
      toast.error("No se pudo abrir el proveedor. Probá de nuevo.")
      establecerYendo(null)
    }
  }

  return (
    <div className={cn("flex flex-col gap-[1.375rem] text-center", className)} {...props}>
      <h1 className="m-0 text-[clamp(1.625rem,4.2vw,2rem)] leading-[1.15] font-semibold tracking-[-0.03em] text-balance">
        {conProgreso ? "Guardá lo que hiciste" : "Tu cuenta de Doro"}
      </h1>
      <p className="-mt-2.5 text-[0.9375rem] text-balance text-muted-foreground">
        {conProgreso
          ? "Tus pomodoros, tareas y salas quedan en tu cuenta y los ves en cualquier dispositivo."
          : "Para que tus tareas y tu estudio te sigan a cualquier dispositivo."}
      </p>

      <div className="flex flex-col gap-2.5">
        {PROVEEDORES.map(({ id, nombre }) => (
          <button
            key={id}
            type="button"
            disabled={yendo !== null}
            onClick={() => entrar(id)}
            className="grid h-[2.875rem] grid-cols-[1.25rem_1fr_1.25rem] items-center rounded-[0.625rem] border bg-card px-4 text-[0.9375rem] font-medium outline-none transition-colors hover:border-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          >
            {ICONOS[id]}
            <span>Seguir con {nombre}</span>
            <span />
          </button>
        ))}
      </div>

      <p className="m-0 text-[0.84375rem] text-balance text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">
        {conProgreso ? (
          <>¿Ya tenés cuenta? Entrá con la misma y <b>sumamos lo de hoy</b>.</>
        ) : (
          "¿Ya tenés cuenta? Entrá con la misma."
        )}
      </p>

      <p className="m-0 text-[0.75rem] text-balance text-muted-foreground">
        Al seguir aceptás los <Link to="/terminos" className="underline underline-offset-[3px] hover:text-foreground">Términos</Link> y la <Link to="/privacidad" className="underline underline-offset-[3px] hover:text-foreground">Política de privacidad</Link>.
      </p>
    </div>
  )
}
