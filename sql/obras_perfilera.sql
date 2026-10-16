-- Perfilera (Muchtek / Rehau) guardada por obra.
-- Correr en Supabase (SQL Editor) ANTES de desplegar el frontend/backend
-- que la mandan: si la columna no existe, crear y editar obras falla.
-- Las obras existentes quedan como 'muchtek' (la única que había).
ALTER TABLE "Obras" ADD COLUMN IF NOT EXISTS perfilera text NOT NULL DEFAULT 'muchtek';
