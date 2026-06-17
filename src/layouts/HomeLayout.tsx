import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

// Layout de las páginas principales: renderiza la ruta hija (Outlet) y monta el
// Toaster global para los avisos/notificaciones (sonner).
const HomeLayout = () => {
    return (
        <div className="">
            <Outlet />
            <Toaster
                position="bottom-right"
                richColors
                closeButton
                duration={4000}
            />
        </div>
    );
}

export default HomeLayout
