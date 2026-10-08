// src/layouts/AuthProviderLayout.tsx
import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";

// Layout raíz que envuelve TODAS las rutas con el proveedor de autenticación,
// para que cualquier página pueda acceder a la sesión vía useAuth().
export default function AuthProviderLayout() {
    return (
        <AuthProvider>
            <Outlet />
        </AuthProvider>
    );
}
