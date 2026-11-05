-- Cumplimiento legal (Ley 25.326, Ley 24.240, Res. SCI 424/2020).
-- Correr una sola vez en Supabase -> SQL Editor.

-- 1) Constancia de aceptacion de Terminos y Politica de Privacidad
--    (handlers/users.ts -> acceptTerms). Mientras terminosVersion no sea la
--    vigente, el frontend le pide al usuario que acepte antes de entrar.
alter table public."Users" add column if not exists "terminosVersion"     text;
alter table public."Users" add column if not exists "terminosAceptadosAt" timestamptz;
alter table public."Users" add column if not exists "terminosAceptadosIp" text;

-- 2) Fecha del consentimiento en las solicitudes de prueba (art. 5 Ley 25.326).
alter table public."SolicitudesPrueba" add column if not exists "consentimientoAt" timestamptz;

-- 3) Boton de arrepentimiento y boton de baja (handlers/bajas.ts). Cada
--    pedido recibe un codigo que se le muestra a la persona como constancia.
create table if not exists public."SolicitudesBaja" (
    id           bigint generated always as identity primary key,
    codigo       text        not null unique,
    tipo         text        not null check (tipo in ('arrepentimiento', 'baja')),
    nombre       text        not null,
    email        text        not null,
    motivo       text,
    estado       text        not null default 'pendiente'
                 check (estado in ('pendiente', 'resuelta')),
    "createdAt"  timestamptz not null default now(),
    "resueltaAt" timestamptz
);

-- Igual que SolicitudesPrueba: RLS sin policies, solo el Backend (service_role).
alter table public."SolicitudesBaja" enable row level security;
