-- Campos nuevos de la ventana de la Planilla:
--   vano          texto "ancho x alto" (ej. "1515x2515"); va siempre a observaciones
--   alturaManija  altura de la manija en mm (solo va a observaciones si se modificó)
--   filoInterior  "pared" | "ceramica" (colocación a filo interior)
--
-- Correr en Supabase (SQL Editor) ANTES de guardar obras con estas ventanas: el
-- handler de planilla inserta la ventana tal cual llega del frontend, y si la
-- tabla no tiene la columna, PostgREST responde 400 (PGRST204, "Could not find the
-- 'vano' column of 'Ventanas' in the schema cache") y la obra no se guarda.
ALTER TABLE "Ventanas" ADD COLUMN IF NOT EXISTS "vano" text;
ALTER TABLE "Ventanas" ADD COLUMN IF NOT EXISTS "alturaManija" double precision;
ALTER TABLE "Ventanas" ADD COLUMN IF NOT EXISTS "filoInterior" text;

-- Refresca el esquema que usa la API REST (si no, sigue devolviendo 400 unos minutos).
NOTIFY pgrst, 'reload schema';
