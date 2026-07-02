// src/Routes.tsx
/* eslint-disable react-refresh/only-export-components */
// Este archivo es configuración del router (exporta `router`), no un módulo de
// componentes para HMR. Los helpers `PantallaCarga`/`conSuspense` viven acá por
// cohesión con el setup de rutas, así que desactivamos la regla de react-refresh.
//
// Definición central de rutas de la app (react-router). Estructura anidada:
//  - AuthProviderLayout: provee el contexto de autenticación a todo lo de adentro.
//    - HomeLayout: páginas principales con sesión (inicio, dashboard, calendario, sala).
//    - AuthLayout: páginas de login y registro.
//    - Páginas sueltas: invitación, términos y privacidad.
//
// Las páginas se cargan con `React.lazy` (code-splitting por ruta): cada una queda en
// su propio chunk y se descarga solo al navegar a ella. Así el bundle inicial no
// arrastra dependencias pesadas como `recharts` (solo la usa el Dashboard). Los layouts
// se mantienen eager porque son livianos y envuelven a todo.
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter } from "react-router-dom";
import AuthProviderLayout from "./layouts/AuthProviderLayout";
import HomeLayout from "./layouts/HomeLayout";
import AuthLayout from "./layouts/AuthLayout";
import { Spinner } from "@/components/ui/spinner";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Registro = lazy(() => import("./pages/Registro"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const Invitacion = lazy(() => import("./pages/InvitacionPage"));
const Room = lazy(() => import("./pages/RoomPage"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

// Fallback mientras el chunk de la página se descarga.
function PantallaCarga() {
    return (
        <div className="w-full h-screen flex items-center justify-center bg-background">
            <Spinner />
        </div>
    );
}

// Envuelve el elemento de una ruta en Suspense para el code-splitting.
function conSuspense(nodo: ReactNode): ReactNode {
    return <Suspense fallback={<PantallaCarga />}>{nodo}</Suspense>;
}

export const router = createBrowserRouter([
    {
        element: <AuthProviderLayout />,
        children: [
            {
                element: <HomeLayout />,
                children: [
                    { index: true, element: conSuspense(<Home />) },
                    { path: "dashboard", element: conSuspense(<Dashboard />) },
                    { path: "calendar", element: conSuspense(<CalendarPage />) },
                    { path: "room/:roomId", element: conSuspense(<Room />) },
                ],
            },
            {
                element: <AuthLayout />,
                children: [
                    { path: "/login", element: conSuspense(<Login />) },
                    { path: "/registro", element: conSuspense(<Registro />) },
                ],
            },
            { path: "invitacion/:code", element: conSuspense(<Invitacion />) },
            { path: "terminos", element: conSuspense(<Terms />) },
            { path: "privacidad", element: conSuspense(<Privacy />) },
        ],
    },
]);
