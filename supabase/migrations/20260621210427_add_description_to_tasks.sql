-- Agrega la columna `description` a `tasks` para soportar la descripción
-- opcional de cada tarea (editable desde el alta rápida y el modal global).
alter table public.tasks add column if not exists description text;
