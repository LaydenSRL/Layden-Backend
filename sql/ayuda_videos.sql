-- Videos de la seccion "Ayuda": el equipo de Layden los carga desde el
-- Dashboard (titulo + link de YouTube) y los clientes los ven en /ayuda.
--
-- Correr una sola vez en Supabase -> SQL Editor, ANTES de desplegar el
-- backend/frontend que la usan.

create table if not exists public."AyudaVideos" (
    id           bigint generated always as identity primary key,
    titulo       text        not null,
    url          text        not null,
    "createdAt"  timestamptz not null default now()
);

-- RLS activado y SIN policies: la anon key no puede leer ni escribir. Todo
-- pasa por el Backend (service_role), que exige sesion para leer y admin para
-- modificar.
alter table public."AyudaVideos" enable row level security;
