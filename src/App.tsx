import './App.css'
import { ThemeProvider } from './components/providers/theme-provider'

// src/App.tsx
// Componente raíz: envuelve toda la aplicación con el proveedor de tema
// (claro/oscuro) y un contenedor a pantalla completa.
export default function App({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="light"
			enableSystem={false}
			disableTransitionOnChange={false}
		>
			<div className='min-h-dvh w-full overflow-x-hidden'>{children}</div>
		</ThemeProvider>
	);
}

