import { Link } from "react-router-dom";
import { IconInnerShadowTop } from "@tabler/icons-react";

// Página estática con la Política de Privacidad de la aplicación
const Privacy = () => {
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
                <h1 className="text-3xl font-bold mb-6">Política de Privacidad</h1>

                <p className="mb-4">Última actualización: {new Date().toLocaleDateString('es-ES')}</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">1. Información que Recopilamos</h2>
                <p className="mb-4">Cuando utilizas Doro, recopilamos la siguiente información personal, proveniente principalment del proveedor de autenticación de terceros (Google, GitHub, Discord):</p>
                <ul className="list-disc pl-6 mb-4">
                    <li className="mb-2"><strong>Información del Perfil:</strong> Tu nombre, dirección de correo electrónico y foto de perfil (avatar).</li>
                    <li className="mb-2"><strong>Datos de Uso:</strong> Información sobre cómo usas el servicio, tu racha de estudio, el tiempo usado en sesiones, etc.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">2. Cómo Usamos tu Información</h2>
                <p className="mb-4">Utilizamos la información recopilada para varios propósitos:</p>
                <ul className="list-disc pl-6 mb-4">
                    <li className="mb-2">Para proveer, mantener e identificar problemas en nuestro Servicio.</li>
                    <li className="mb-2">Para permitirte participar en funciones interactivas, como salas de estudio, chat e interacción visual con otros usuarios.</li>
                    <li className="mb-2">Para gestionar tu cuenta de usuario (guardar configuraciones, progresos y tareas).</li>
                    <li className="mb-2">Para proveer soporte y asistencia al cliente.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">3. Cómo Compartimos tu Información</h2>
                <p className="mb-4"><strong>No vendemos ni alquilamos tu información personal.</strong> Compartimos cierta información únicamente en los siguientes contextos:</p>
                <ul className="list-disc pl-6 mb-4">
                    <li className="mb-2"><strong>Salas de Estudio:</strong> Tu nombre de usuario y foto de perfil serán visibles para los usuarios dentro de las salas de estudio compartidas.</li>
                    <li className="mb-2"><strong>Proveedores de Servicios:</strong> Utilizamos herramientas como Supabase (para base de datos y autenticación) y Vercel (analíticas básicas y alojamiento). Estos proveedores tienen sus propias políticas de privacidad.</li>
                </ul>

                <h2 className="text-2xl font-semibold mt-8 mb-4">4. Seguridad de los Datos</h2>
                <p className="mb-4">La seguridad de tus datos es importante para nosotros. Doro no almacena contraseñas, dependemos completamente del flujo OAuth seguro proporcionado por los servicios de terceros (Google, GitHub, Discord).</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">5. Tus Derechos y Control</h2>
                <p className="mb-4">Tienes derecho a acceder, actualizar o solicitar la eliminación de tu información personal. Puedes hacer esto contactando al soporte del servicio a través de nuestro repositorio o canales oficiales. También puedes desvincular el acceso a Doro desde la configuración de tu proveedor OAuth.</p>

                <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cambios a esta Política</h2>
                <p className="mb-4">Podemos actualizar nuestra Política de Privacidad ocasionalmente. Se notificará a los usuarios sobre cualquier cambio significativo en nuestra plataforma.</p>

                <div className="mt-12 pt-6 border-t border-border">
                    <Link to="/login" className="text-primary hover:underline">Volver al inicio de sesión</Link>
                </div>
            </div>
        </div>
    );
};

export default Privacy;
