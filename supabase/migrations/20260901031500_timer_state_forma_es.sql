-- Alinea `rooms.timer_state` con el contrato `EstadoReloj` del cliente.
--
-- Problema: el default de la columna y las filas anteriores a la traducción al
-- español usan las claves en inglés (`mode`/`isActive`/`timeLeft`/`updatedAt`),
-- pero desde el refactor el cliente lee `modo`/`estaActivo`/`tiempoRestante`/
-- `actualizadoEn`. Al leer una de esas filas, el store calcula
-- `configuracion[undefined] * 60` → NaN y la sala se queda clavada en 00:00.
--
-- Nota: los VALORES de `modo` siguen en inglés a propósito (indexan la
-- configuración del cliente); acá solo se renombran las CLAVES.

-- 1) Default de la columna, en la forma que el cliente sabe leer.
alter table public.rooms
  alter column timer_state
  set default '{"modo": "pomodoro", "estaActivo": false, "tiempoRestante": 1500, "actualizadoEn": null}'::jsonb;

-- 2) Backfill de las filas viejas: renombre de claves, sin inventar datos.
--
-- `estaActivo` se fuerza a false en vez de arrastrar el `isActive` original:
-- estas filas llevan meses sin tocarse, así que ninguna sesión sigue corriendo.
-- Si dejáramos true, el store reconstruiría el fin del intervalo desde un
-- `actualizadoEn` viejísimo y el reloj daría 0 igual.
update public.rooms
set timer_state = jsonb_build_object(
      'modo',           timer_state -> 'mode',
      'estaActivo',     false,
      'tiempoRestante', timer_state -> 'timeLeft',
      'actualizadoEn',  timer_state -> 'updatedAt'
    )
where timer_state ? 'timeLeft'
  and timer_state ->> 'mode' in ('pomodoro', 'shortBreak', 'longBreak', 'stopwatch')
  and jsonb_typeof(timer_state -> 'timeLeft') = 'number'
  and (timer_state ->> 'timeLeft')::numeric between 0 and 86400;

-- 3) Las filas que no pudieron traducirse (modo desconocido, tiempo corrupto o
-- fuera de rango) vuelven al default: es preferible un pomodoro limpio a un
-- estado que el cliente no sabe interpretar.
update public.rooms
set timer_state = '{"modo": "pomodoro", "estaActivo": false, "tiempoRestante": 1500, "actualizadoEn": null}'::jsonb
where timer_state is null
   or not (timer_state ? 'tiempoRestante');
