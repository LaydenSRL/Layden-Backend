-- Ajustes de la planilla de cada cliente (Planilla > Configuración > Ajustes):
--   invertirManos, excedenteVano, vincularVano, excedenteContramarcos, insumos.
-- Es un jsonb: lo que falta se completa con los valores por defecto en el frontend.
-- La policy de UPDATE propia de "Users" ya permite que cada cliente edite su fila.
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS ajustes jsonb;
