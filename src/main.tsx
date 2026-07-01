import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { router } from './Routes'
import { RouterProvider } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'

// gcTime de 24h: necesario para que las entradas sobrevivan lo suficiente como
// para persistirse y restaurarse entre recargas/navegaciones.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
})

// Persistimos la caché en localStorage para que el dashboard pinte al instante
// con datos previos (sin re-pedir ni recalcular) mientras revalida en segundo plano.
const persister = createSyncStoragePersister({ storage: window.localStorage })

// Solo persistimos las queries del dashboard. Las queries en vivo (salas,
// presencia, tareas en edición) NO deben guardarse en disco: cambian a cada rato
// y deben venir frescas del servidor.
const CLAVES_PERSISTIDAS = new Set(['dashboardAggregates', 'userStats', 'recentTasks'])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 1000 * 60 * 60 * 24,
        // Subir esta versión invalida toda la caché persistida (p. ej. si cambia
        // la forma de los datos del dashboard).
        buster: 'dashboard-v1',
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' &&
            CLAVES_PERSISTIDAS.has(query.queryKey[0] as string),
        },
      }}
    >
      <App>
        <RouterProvider router={router} />
        <Analytics />
      </App>
    </PersistQueryClientProvider>
  </StrictMode>,
)
