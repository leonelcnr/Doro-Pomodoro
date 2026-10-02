# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Estudiantes que usan Doro para sesiones de estudio con la técnica Pomodoro, solos o
acompañados. El trabajo que vienen a hacer: entrar rápido a una sala compartida con
amigos o compañeros, enfocarse con un reloj sincronizado y llevar sus tareas.

## Product Purpose
Doro es un temporizador Pomodoro con salas colaborativas en tiempo real: reloj y música
compartidos, tareas personales y de sala, estadísticas de enfoque (Dashboard) y un
calendario integrado con Google Calendar. El éxito es que estudiar acompañado cueste un
clic.

## Positioning
La sala compartida es el mecanismo: varias personas ven el mismo reloj, la misma música y
las mismas tareas en vivo, y se invitan con un link.

## Operating Context
- El home es la pantalla de entrada después del login. Lo primero que tiene que permitir
  es **entrar a una sala** (crear una nueva o unirse a una existente).
- La mayoría entra a salas ajenas por link de invitación (`/invitacion/...`); el código
  manual es un camino secundario.
- Las tareas personales se escriben con atajos en línea (`!alta`, `#estudio`).
- Sesiones anónimas existen: el saludo no siempre tiene nombre.

## Capabilities and Constraints
- Auth con Google/GitHub/Discord y sesiones anónimas (Supabase).
- Salas: crear (nace con la configuración de tiempos del creador) y unirse por código o link.
- Tareas: título, estado, prioridad, categoría; drag & drop; filtro por categoría.
- Stats: minutos de hoy, racha de días, tareas completadas.
- Toda la UI está en español rioplatense (voseo: "Iniciá", "Escribí").
- Idea en evaluación: que cada usuario elija el color de acento de la app.

## Brand Commitments
- Nombre: Doro.
- Logo: el anillo circular (`public/doro.svg`) se conserva.
- Tipografía: Geist se conserva.
- El color de acento puede cambiar; el violeta actual no es obligatorio.
- Sin gradientes. Minimalista, simple, moderno, poca información por pantalla.

## Evidence on Hand
Capturas reales de la app en `public/` (`Home.png`, `RoomPage.png`, `dashboard.png`,
`login.png`). No hay testimonios, métricas públicas ni usuarios nombrables: no inventarlos.

## Product Principles
1. Entrar a estudiar acompañado tiene que costar un clic.
2. Una pantalla, una intención: lo secundario se esconde, no se apila.
3. El reloj es la identidad; todo lo demás acompaña.
4. Calma por sobre estímulo: la app se usa mientras se estudia.
