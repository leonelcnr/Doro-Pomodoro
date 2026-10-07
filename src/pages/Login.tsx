import { Link, Navigate, useSearchParams } from "react-router-dom"
import { IconArrowLeft, IconInnerShadowTop } from "@tabler/icons-react"
import { LoginForm } from "@/components/login-form"
import { useAuth } from "@/features/auth/context/useAuth"
import { rutaSegura } from "@/features/auth/authHelpers"

// Página de la cuenta: se llega desde «Entrar» o «Guardar mi progreso». Quien ya
// tiene cuenta no tiene nada que hacer acá y vuelve a donde iba.
const Login = () => {
	const { user, cargando } = useAuth()
	const [params] = useSearchParams()
	const volverA = rutaSegura(params.get("redirect"))

	if (!cargando && user && !user.isAnonymous) return <Navigate to={volverA} replace />

	return (
		<main className="relative flex min-h-svh w-full flex-col items-center justify-center px-5 pt-10 pb-14">
			<Link
				to={volverA}
				className="absolute top-4 left-5 inline-flex items-center gap-1.5 py-1.5 text-[0.875rem] text-muted-foreground hover:text-foreground md:left-8"
			>
				<IconArrowLeft className="size-[0.9375rem]" />
				Seguir sin cuenta
			</Link>
			<div className="flex w-[min(100%,23.75rem)] flex-col gap-[1.375rem]">
				<Link to="/" aria-label="Doro, inicio" className="grid place-items-center">
					<IconInnerShadowTop className="size-10 text-brand" />
				</Link>
				<LoginForm conProgreso={user?.isAnonymous ?? false} volverA={volverA} />
			</div>
		</main>
	)
}

export default Login
