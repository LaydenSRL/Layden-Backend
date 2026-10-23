import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';

const TABLE = 'AyudaVideos';

// Acepta los formatos comunes de YouTube: watch?v=, youtu.be/, shorts/,
// embed/ y live/. El frontend arma el reproductor a partir del id, asi que
// cualquier otro link no serviria de nada.
const YOUTUBE_REGEX =
    /^https?:\/\/(www\.|m\.)?(youtube\.com\/(watch\?(.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)[\w-]{11}/;

const parseBody = (body: any): { titulo: string; url: string } | string => {
    const titulo = typeof body?.titulo === 'string' ? body.titulo.trim() : '';
    const url = typeof body?.url === 'string' ? body.url.trim() : '';

    if (titulo.length < 2 || titulo.length > 120) {
        return 'El titulo debe tener entre 2 y 120 caracteres.';
    }
    if (!YOUTUBE_REGEX.test(url)) {
        return 'El link tiene que ser un video de YouTube.';
    }
    return { titulo, url };
};

export const getAyudaVideos = async (_req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select('*')
            .order('createdAt', { ascending: true });
        if (error) throw error;
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al obtener los videos de ayuda' });
    }
};

export const createAyudaVideo = async (req: Request, res: Response) => {
    const parsed = parseBody(req.body);
    if (typeof parsed === 'string') return res.status(400).json({ error: parsed });

    try {
        const { data, error } = await supabase.from(TABLE).insert([parsed]).select().single();
        if (error) throw error;
        res.status(201).json(data);
    } catch (error: any) {
        console.error('Error creando video de ayuda:', error);
        res.status(500).json({ error: error.message || 'Error al crear el video de ayuda' });
    }
};

export const updateAyudaVideo = async (req: Request, res: Response) => {
    const parsed = parseBody(req.body);
    if (typeof parsed === 'string') return res.status(400).json({ error: parsed });

    try {
        const { data, error } = await supabase
            .from(TABLE)
            .update(parsed)
            .eq('id', req.params.id)
            .select()
            .single();
        if (error) throw error;
        res.status(200).json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al actualizar el video de ayuda' });
    }
};

export const deleteAyudaVideo = async (req: Request, res: Response) => {
    try {
        const { error } = await supabase.from(TABLE).delete().eq('id', req.params.id);
        if (error) throw error;
        res.status(200).json({ message: 'Video eliminado' });
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'Error al eliminar el video de ayuda' });
    }
};
