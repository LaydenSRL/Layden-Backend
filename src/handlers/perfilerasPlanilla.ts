import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';

const TABLE = 'ConfiguracionPlanilla';

// Perfileras de la Planilla: marcas con sus lineas (nombre, tipo y espesores de
// marco/hoja) y sus terminaciones (valor y espesor). Se guarda tal cual lo arma el
// frontend (Dashboard), pero se valida la forma para no persistir basura que
// despues rompa el dibujo de todas las planillas.

type TipoLinea = 'abrir' | 'corrediza' | 'sinHoja';
const TIPOS_LINEA: TipoLinea[] = ['abrir', 'corrediza', 'sinHoja'];

type LineaPerfil = { nombre: string; tipo: TipoLinea; marco: number; hoja: number };
type TerminacionPerfil = { valor: string; espesor: number };
type Perfilera = { id: string; nombre: string; logo?: string; lineas: LineaPerfil[]; terminaciones: TerminacionPerfil[] };

const esTexto = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;
const esMedida = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 1000;

// Devuelve el primer problema encontrado, o null si la lista es valida.
export const validarPerfileras = (lista: unknown): string | null => {
    if (!Array.isArray(lista) || lista.length === 0) return 'Tiene que haber al menos una perfilera.';

    const ids = new Set<string>();

    for (const p of lista as Partial<Perfilera>[]) {
        if (!p || !esTexto(p.id) || !esTexto(p.nombre)) return 'Cada perfilera necesita un id y un nombre.';
        if (ids.has(p.id)) return `La perfilera "${p.nombre}" esta repetida.`;
        ids.add(p.id);

        if (p.logo !== undefined && typeof p.logo !== 'string') return `El logo de "${p.nombre}" no es valido.`;
        if (!Array.isArray(p.lineas) || !Array.isArray(p.terminaciones)) return `Faltan las lineas o terminaciones de "${p.nombre}".`;

        // Dos perfileras pueden tener una linea con el mismo nombre (se usa la de la perfilera
        // de la obra), pero dentro de una misma perfilera no puede repetirse.
        const lineasUsadas = new Set<string>();
        for (const l of p.lineas) {
            if (!l || !esTexto(l.nombre)) return `Una linea de "${p.nombre}" no tiene nombre.`;
            if (!TIPOS_LINEA.includes(l.tipo)) return `La linea "${l.nombre}" tiene un tipo invalido.`;
            if (!esMedida(l.marco) || !esMedida(l.hoja)) return `La linea "${l.nombre}" necesita el espesor de marco y de hoja (en mm).`;
            const clave = l.nombre.trim().toLowerCase();
            if (lineasUsadas.has(clave)) return `La linea "${l.nombre}" esta repetida en "${p.nombre}".`;
            lineasUsadas.add(clave);
        }

        const valores = new Set<string>();
        for (const t of p.terminaciones) {
            if (!t || !esTexto(t.valor)) return `Una terminacion de "${p.nombre}" no tiene valor.`;
            if (!esMedida(t.espesor)) return `La terminacion "${t.valor}" necesita su espesor (en mm).`;
            if (valores.has(t.valor.trim())) return `La terminacion "${t.valor}" esta repetida en "${p.nombre}".`;
            valores.add(t.valor.trim());
        }
    }

    return null;
};

export const getPerfilerasPlanilla = async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabase.from(TABLE).select('perfileras').eq('id', 1).maybeSingle();
        if (error) throw error;
        // Sin fila o sin nada cargado: el frontend usa sus valores de fabrica.
        res.set('Cache-Control', 'no-store');
        res.status(200).json({ data: data?.perfileras ?? null });
    } catch (error: any) {
        console.error('Error al obtener las perfileras de la planilla:', error);
        res.status(500).json({ error: error.message || 'Error al obtener las perfileras de la planilla' });
    }
};

export const updatePerfilerasPlanilla = async (req: Request, res: Response) => {
    const perfileras = (req.body as { perfileras?: unknown })?.perfileras;
    const problema = validarPerfileras(perfileras);
    if (problema) return res.status(400).json({ error: problema });

    try {
        const { data, error } = await supabase
            .from(TABLE)
            .upsert({ id: 1, perfileras, updatedAt: new Date().toISOString() })
            .select('perfileras')
            .single();
        if (error) throw error;
        res.status(200).json({ data: data.perfileras });
    } catch (error: any) {
        console.error('Error al guardar las perfileras de la planilla:', error);
        res.status(500).json({ error: error.message || 'Error al guardar las perfileras de la planilla' });
    }
};
