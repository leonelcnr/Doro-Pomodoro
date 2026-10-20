// src/layouts/AuthProviderLayout.tsx
import { Outlet } from "react-router-dom";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { AvisoPunto } from "@/components/AvisoPunto";
import { useAvisoStore } from "@/store/avisoStore";

// Layout raíz que envuelve TODAS las rutas con el proveedor de autenticación,
// para que cualquier página pueda acceder a la sesión vía useAuth(). También
// monta el aviso único de la app (`avisar` de `@/store/avisoStore`).
export default function AuthProviderLayout() {
    const { aviso, lugar, alTerminar } = useAvisoStore();
    return (
        <AuthProvider>
            <Outlet />
            <AvisoPunto aviso={aviso} lugar={lugar} alTerminar={alTerminar} />
        </AuthProvider>
    );
}
