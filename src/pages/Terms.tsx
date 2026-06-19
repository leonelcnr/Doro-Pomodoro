import { Link } from "react-router-dom";
import { IconInnerShadowTop } from "@tabler/icons-react";

// Página estática con los Términos y Condiciones de la aplicación
const Terms = () => {
    return (
        <div className="flex min-h-svh flex-col items-center justify-start gap-6 p-6 md:p-10 w-full max-w-4xl mx-auto">
            <div className="flex w-full items-center mb-8">
                <Link to="/" className="flex items-center gap-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-primary">
                        <IconInnerShadowTop className="size-5" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                        <span className="font-semibold text-lg">Doro</span>
                    </div>
                </Link>
            </div>

            <div className="prose prose-sm md:prose-base dark:prose-invert w-full max-w-none text-left">
                <h1 className="text-3xl font-bold mb-6">Términos y Condiciones</h1>

                <p className="mb-4">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">1. Aceptación de los Términos</h2>
                <p className="mb-4">Al acceder y utilizar Doro ("nosotros", "la aplicación", "el servicio"), aceptas estar sujeto a estos Términos y Condiciones. Si no estás de acuerdo con alguna parte de los términos, no podrás acceder al servicio.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">2. Descripción del Servicio</h2>
                <p className="mb-4">Doro es una plataforma diseñada para gestionar el tiempo de estudio y trabajo mediante la técnica Pomodoro, ofreciendo salas sincronizadas, chat, sistema de tareas y reproductor de música. El servicio se proporciona "tal cual" y "según disponibilidad".</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">3. Cuentas de Usuario</h2>
                <p className="mb-4">
                    Para utilizar ciertas características del servicio, debes registrarte o iniciar sesión utilizando proveedores de terceros (OAuth como Google, GitHub o Discord).
                </p>
                <ul className="list-disc pl-6 mb-4">
                    <li className="mb-2">Eres responsable de mantener la confidencialidad de tu información de inicio de sesión.</li>
                    <li className="mb-2">Eres responsable de todas las actividades que ocurran bajo tu cuenta.</li>
                    <li className="mb-2">Debes notificarnos inmediatamente si tienes conocimiento de cualquier uso no autorizado de tu cuenta.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">4. Conducta del Usuario</h2>
                <p className="mb-4">Al usar Doro, te comprometes a:</p>
                <ul className="list-disc pl-6 mb-4">
                    <li className="mb-2">No utilizar el servicio para fines ilegales o no autorizados.</li>
                    <li className="mb-2">No acosar, abusar o amenazar a otros usuarios en las salas de estudio o el chat.</li>
                    <li className="mb-2">No interferir o interrumpir el servicio o los servidores conectados al servicio.</li>
                    <li className="mb-2">No utilizar música compartida que viole derechos de autor o que contenga material inapropiado.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">5. Propiedad Intelectual</h2>
                <p className="mb-4">Todo el contenido original, características y la funcionalidad son propiedad de Doro y están protegidos por derechos de autor internacionales.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">6. Terminación</h2>
                <p className="mb-4">Podemos terminar o suspender tu cuenta de inmediato, sin previo aviso o responsabilidad, por cualquier motivo, incluyendo sin limitación si incumples los Términos.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cambios en los Términos</h2>
                <p className="mb-4">Nos reservamos el derecho de modificar estos términos en cualquier momento. Al continuar utilizando nuestro servicio después de que las revisiones entren en vigencia, aceptas estar sujeto a los términos revisados.</p>

                <div className="mt-12 pt-6 border-t border-border">
                    <Link to="/login" className="text-primary hover:underline">Volver al inicio de sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default Terms;
