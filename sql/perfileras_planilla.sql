-- Perfileras de la Planilla: marcas de perfiles con sus lineas (tipo y
-- espesores de marco y hoja) y sus terminaciones (valor y espesor). Las
-- configura el equipo de Layden desde el Dashboard y las usan todas las
-- planillas: la obra elige la marca y cada ventana ofrece solo las lineas y
-- terminaciones de esa marca.
--
-- Correr una sola vez en Supabase -> SQL Editor, ANTES de desplegar el
-- backend/frontend que la usan.
--
-- Es una tabla de UNA sola fila (id = 1). Mientras "perfileras" sea null, el
-- frontend usa los valores de fabrica (Muchtek y Rehau).

create table if not exists public."ConfiguracionPlanilla" (
    id           smallint    primary key default 1 check (id = 1),
    perfileras   jsonb,
    "updatedAt"  timestamptz not null default now()
);

insert into public."ConfiguracionPlanilla" (id) values (1) on conflict (id) do nothing;

-- RLS activado y SIN policies: la anon key no puede leer ni escribir (asi un
-- usuario no puede modificarlo desde el navegador con la clave publica). Todo
-- pasa por el Backend (service_role): cualquier sesion lo lee y solo un admin
-- (el unico rol que entra al Dashboard) lo modifica.
alter table public."ConfiguracionPlanilla" enable row level security;
