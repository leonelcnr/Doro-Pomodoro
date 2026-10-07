// src/Routes.tsx
/* eslint-disable react-refresh/only-export-components */
// Este archivo es configuración del router (exporta `router`), no un módulo de
// componentes para HMR. Los helpers `PantallaCarga`/`conSuspense` viven acá por
// cohesión con el setup de rutas, así que desactivamos la regla de react-refresh.
//
// Definición central de rutas de la app (react-router). Estructura anidada:
//  - AuthProviderLayout: provee el contexto de autenticación a todo lo de adentro.
//    - HomeLayout: páginas principales (inicio, tareas, dashboard, sala), con o sin cuenta.
//    - AuthLayout: la página de la cuenta (/login; /registro redirige ahí).
//    - Páginas sueltas: invitación, términos y privacidad.
//
// Las páginas se cargan con `React.lazy` (code-splitting por ruta): cada una queda en
// su propio chunk y se descarga solo al navegar a ella. Así el bundle inicial no
// arrastra dependencias pesadas como `recharts` (solo la usa el Dashboard). Los layouts
// se mantienen eager porque son livianos y envuelven a todo.
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Navigate, useLocation } from "react-router-dom";
import AuthProviderLayout from "./layouts/AuthProviderLayout";
import HomeLayout from "./layouts/HomeLayout";
import AuthLayout from "./layouts/AuthLayout";
import { Spinner } from "@/components/ui/spinner";
// Eager a propósito: es el errorElement global y tiene que poder renderizarse
// incluso cuando lo que falló es justamente la carga de un chunk lazy.
import ErrorPage from "./pages/ErrorPage";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tareas = lazy(() => import("./pages/TareasPage"));
const Invitacion = lazy(() => import("./pages/InvitacionPage"));
const Room = lazy(() => import("./pages/RoomPage"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NoEncontrada = lazy(() => import("./pages/NoEncontrada"));

// Fallback mientras el chunk de la página se descarga.
function PantallaCarga() {
    return (
        <div className="w-full h-screen flex items-center justify-center bg-background">
            <Spinner />
        </div>
    );
}

// `/registro` era el mismo formulario que el login: ahora hay una sola puerta.
// Se conserva el query (`?redirect=`) de los links viejos.
function RegistroALogin() {
    const { search } = useLocation();
    return <Navigate to={`/login${search}`} replace />;
}

// Envuelve el elemento de una ruta en Suspense para el code-splitting.
function conSuspense(nodo: ReactNode): ReactNode {
    return <Suspense fallback={<PantallaCarga />}>{nodo}</Suspense>;
}

export const router = createBrowserRouter([
    {
        element: <AuthProviderLayout />,
        // Captura errores de render y fallos de carga de chunks de TODAS las rutas
        // hijas (react-router no los propaga a boundaries fuera del router).
        errorElement: <ErrorPage />,
        children: [
            {
                element: <HomeLayout />,
                // Si se rompe una página, el error queda en su área con el encabezado
                errorElement: <ErrorPage conEncabezado />,
                children: [
                    { index: true, element: conSuspense(<Home />) },
                    { path: "tareas", element: conSuspense(<Tareas />) },
                    { path: "dashboard", element: conSuspense(<Dashboard />) },
                    // El calendario viejo se fue: su lugar es la vista «Calendario» de Tareas
                    { path: "calendar", element: <Navigate to="/tareas" replace /> },
                    { path: "room/:roomId", element: conSuspense(<Room />) },
                    { path: "*", element: conSuspense(<NoEncontrada />) },
                ],
            },
            {
                element: <AuthLayout />,
                children: [
                    { path: "/login", element: conSuspense(<Login />) },
                    { path: "/registro", element: <RegistroALogin /> },
                ],
            },
            { path: "invitacion/:code", element: conSuspense(<Invitacion />) },
            { path: "terminos", element: conSuspense(<Terms />) },
            { path: "privacidad", element: conSuspense(<Privacy />) },
        ],
    },
]);
