import { LoginForm } from "@/components/login-form"
import { IconInnerShadowTop } from "@tabler/icons-react"

// Página de inicio de sesión: muestra el logo de la app y el formulario de login
const Login = () => {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<a href="#" className="flex items-center gap-2 self-center">
					<div className="flex aspect-square size-8 items-center justify-center rounded-lg text-primary">
						<IconInnerShadowTop className="size-5" />
					</div>
					<div className="flex flex-col gap-0.5 leading-none">
						<span className="font-semibold text-lg">Doro</span>
					</div>
				</a>
				<LoginForm />
			</div>
		</div>
	)
}

export default Login
