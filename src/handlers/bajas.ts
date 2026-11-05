import crypto from 'crypto';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabaseConfig';
import { notifyBajaRequest } from '../utils/notifyTrialRequest';

const TABLE = 'SolicitudesBaja';

export const validateBaja = [
    body('tipo').isIn(['arrepentimiento', 'baja']).withMessage('Tipo de solicitud invalido.'),
    body('nombre').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres.'),
    body('email').trim().toLowerCase().isEmail().withMessage('El email no es valido.'),
    body('motivo').optional({ values: 'falsy' }).isString().trim().isLength({ max: 1000 }).withMessage('El motivo es demasiado largo.'),
];

// Codigo corto y legible para que la persona lo guarde como constancia
// (Res. SCI 424/2020 pide un codigo de identificacion de la solicitud).
const generarCodigo = (tipo: string) =>
    `${tipo === 'baja' ? 'BAJA' : 'ARR'}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

// Publica: boton de arrepentimiento (Res. SCI 424/2020) y boton de baja (art.
// 10 ter Ley 24.240). No pide iniciar sesion: no se le puede exigir al
// cliente ningun requisito extra para darse de baja.
export const createBajaRequest = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { tipo, nombre, email } = req.body;
    const motivo = req.body.motivo || null;
    const codigo = generarCodigo(tipo);

    const { error } = await supabase.from(TABLE).insert({ codigo, tipo, nombre, email, motivo });

    if (error) {
        console.error('Error guardando la solicitud de baja:', error);
        return res.status(500).json({ error: 'No se pudo registrar la solicitud. Escribinos a laydensrl@gmail.com.' });
    }

    await notifyBajaRequest({ codigo, tipo, nombre, email, motivo });

    res.status(201).json({ codigo });
};

// Solo admin: pendientes, las mas viejas primero.
export const listBajaRequests = async (_req: Request, res: Response) => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('estado', 'pendiente')
        .order('createdAt', { ascending: true });

    if (error) {
        console.error('Error listando solicitudes de baja:', error);
        return res.status(500).json({ error: 'No se pudieron obtener las solicitudes de baja.' });
    }

    res.status(200).json(data);
};

// Solo admin: el equipo ya dio de baja la suscripcion (y la cancelo en
// MercadoPago) o hizo el reintegro.
export const resolveBajaRequest = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Id invalido.' });
    }

    const { data, error } = await supabase
        .from(TABLE)
        .update({ estado: 'resuelta', resueltaAt: new Date().toISOString() })
        .eq('id', id)
        .eq('estado', 'pendiente')
        .select();

    if (error) {
        console.error('Error resolviendo la solicitud de baja:', error);
        return res.status(500).json({ error: 'No se pudo marcar como resuelta.' });
    }
    if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Solicitud no encontrada o ya resuelta.' });
    }

    res.status(200).json({ success: true });
};
