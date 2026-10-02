-- Solicitudes de prueba gratuita: el formulario publico del Home guarda una fila
-- aca y NO crea ninguna cuenta. El equipo de Layden las aprueba o rechaza a
-- mano desde el Dashboard (ver handlers/trial.ts).
--
-- Correr una sola vez en Supabase -> SQL Editor.

create table if not exists public."SolicitudesPrueba" (
    id           bigint generated always as identity primary key,
    nombre       text        not null,
    email        text        not null,
    numero       text        not null,
    estado       text        not null default 'pendiente'
                 check (estado in ('pendiente', 'aprobada', 'rechazada')),
    "createdAt"  timestamptz not null default now(),
    "resueltaAt" timestamptz
);

-- Un mismo email no puede tener dos solicitudes pendientes a la vez (sin
-- distinguir mayusculas). Una vez resuelta, puede volver a pedir.
create unique index if not exists solicitudes_prueba_email_pendiente
    on public."SolicitudesPrueba" (lower(email))
    where estado = 'pendiente';

-- RLS activado y SIN policies: la anon key (que es publica en el frontend) no
-- puede leer ni escribir esta tabla. Solo el Backend, con la service_role key.
alter table public."SolicitudesPrueba" enable row level security;
