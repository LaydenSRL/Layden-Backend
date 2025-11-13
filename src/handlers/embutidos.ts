import { Request, Response } from 'express';
import { supabase } from '../config/supabaseConfig';

export const createEmbutido = async (req: Request, res: Response) => {
  try {
    console.log('Body recibido:', req.body);
    const { data, error } = await supabase
      .from('embutidos')
      .insert([req.body])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    console.error('Error creando embutido:', error);
    res.status(500).json({ error: error.message || 'Error al crear embutido' });
  }
};

export const getEmbutidos = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('embutidos').select('*').order('createdAt', { ascending: false });
    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener embutidos' });
  }
};

export const getEmbutidoById = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('embutidos').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.status(200).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al obtener embutido' });
  }
};

export const updateEmbutido = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('embutidos').update(req.body).eq('id', req.params.id);
    if (error) throw error;
    res.status(200).json({ message: 'Embutido actualizado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al actualizar embutido' });
  }
};

export const deleteEmbutido = async (req: Request, res: Response) => {
  try {
    const { error } = await supabase.from('embutidos').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(200).json({ message: 'Embutido eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al eliminar embutido' });
  }
};