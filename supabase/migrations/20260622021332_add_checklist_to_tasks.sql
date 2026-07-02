-- Agrega la columna `checklist` a `tasks` (lista de sub-ítems por tarea).
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '[]'::jsonb;
