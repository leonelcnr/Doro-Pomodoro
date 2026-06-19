import { createClient } from "@supabase/supabase-js"

// Cliente único de Supabase para toda la app. Lee la URL y la clave anónima de
// las variables de entorno de Vite. Mantiene la sesión persistida y la refresca
// automáticamente.
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
        },
    }
)

export default supabase
