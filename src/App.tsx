import { ThemeProvider } from './components/providers/theme-provider'

// src/App.tsx
// Componente raíz: envuelve toda la aplicación con el proveedor de tema
// (claro, oscuro o negro) y un contenedor a pantalla completa. El
// `color-scheme` lo pone index.css según la clase: next-themes solo conoce
// light/dark y en «negro» lo dejaría en claro.
export default function App({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider
			attribute="class"
			themes={['light', 'dark', 'negro']}
			defaultTheme="light"
			enableColorScheme={false}
			enableSystem={false}
			disableTransitionOnChange={false}
		>
			<div className='min-h-dvh w-full overflow-x-hidden'>{children}</div>
		</ThemeProvider>
	);
}

