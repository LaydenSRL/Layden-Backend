-- Planilla de insumos editada a mano (lista de { name, cantidad }).
-- Si está cargada, el frontend la muestra en vez de recalcularla con
-- calcularInsumos, así una edición manual no se pierde al reabrir la obra.
-- Correr en Supabase (SQL Editor) antes de usar "Guardar planilla de
-- insumos": sin la columna, ese guardado falla (el resto no se ve afectado).
ALTER TABLE "Obras" ADD COLUMN IF NOT EXISTS "insumosOverride" jsonb;
