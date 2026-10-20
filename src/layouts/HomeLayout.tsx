import { Outlet } from "react-router-dom";

// Layout de las páginas principales: renderiza la ruta hija (Outlet). El aviso
// global lo monta `AuthProviderLayout`.
const HomeLayout = () => {
    return <Outlet />;
}

export default HomeLayout
