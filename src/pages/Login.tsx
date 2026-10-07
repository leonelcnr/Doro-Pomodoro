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
		<div className="relative flex min-h-svh w-full flex-col items-center justify-center gap-8 p-6 md:p-10">
			<Link
				to={volverA}
				className="absolute top-4 left-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<IconArrowLeft className="size-4" />
				Seguir sin cuenta
			</Link>
			<div className="flex w-full max-w-[23.75rem] flex-col gap-8">
				<Link to="/" className="flex items-center gap-2 self-center">
					<div className="flex aspect-square size-8 items-center justify-center rounded-lg text-primary">
						<IconInnerShadowTop className="size-5" />
					</div>
					<span className="font-semibold text-lg">Doro</span>
				</Link>
				<LoginForm conProgreso={user?.isAnonymous ?? false} volverA={volverA} />
			</div>
		</div>
	)
}

export default Login
