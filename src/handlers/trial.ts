import crypto from 'crypto';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabaseConfig';
import { notifyTrialRequest } from '../utils/notifyTrialRequest';

const TABLE = 'SolicitudesPrueba';

export const validateTrialSignup = [
    body('nombre').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres.'),
    body('email').trim().toLowerCase().isEmail().withMessage('El email no es valido.'),
    body('numero').trim().isLength({ min: 6 }).withMessage('El numero de telefono no es valido.'),
];

const escapeLike = (value: string) => value.replace(/[\\%_]/g, '\\$&');

// Publica (formulario del Home). Ya NO crea la cuenta: solo guarda una
// solicitud y le avisa al equipo, que la aprueba a mano desde el Dashboard
// (approveTrialRequest). Asi se evitan multicuentas y varios mails de una
// misma empresa, y los 30 dias arrancan recien cuando se habilita.
export const createTrialRequest = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nombre, email, numero } = req.body;

    const { data: existentes, error: existentesError } = await supabase
        .from('Users')
        .select('id')
        .ilike('email', escapeLike(email))
        .limit(1);

    if (existentesError) {
        console.error('Error buscando usuario existente:', existentesError);
        return res.status(500).json({ error: 'No se pudo enviar la solicitud.' });
    }

    if (existentes && existentes.length > 0) {
        return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
    }

    const { error: insertError } = await supabase.from(TABLE).insert({ nombre, email, numero });

    if (insertError) {
        // 23505 = unique_violation: ya hay una solicitud pendiente con ese email
        if (insertError.code === '23505') {
            return res.status(409).json({ error: 'Ya recibimos una solicitud con ese email. Te vamos a escribir apenas la revisemos.' });
        }
        console.error('Error guardando la solicitud de prueba:', insertError);
        return res.status(500).json({ error: 'No se pudo enviar la solicitud.' });
    }

    await notifyTrialRequest({ nombre, email, numero });

    res.status(201).json({ success: true });
};

// Solo admin (ver trialRouter): solicitudes pendientes, las mas viejas primero.
export const listTrialRequests = async (_req: Request, res: Response) => {
    const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('estado', 'pendiente')
        .order('createdAt', { ascending: true });

    if (error) {
        console.error('Error listando solicitudes de prueba:', error);
        return res.status(500).json({ error: 'No se pudieron obtener las solicitudes.' });
    }

    res.status(200).json(data);
};

// Solo admin. Crea la cuenta con la service_role key (nunca signUp() desde un
// navegador, que reemplazaria la sesion del admin), con una contraseña al
// azar que nadie ve, rol 'Prueba' y pruebaInicio = ahora (los 30 dias
// cuentan desde la aprobacion, no desde el pedido). Despues dispara el mail
// de "restablecer contraseña" para que la persona elija la suya.
export const approveTrialRequest = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Id invalido.' });
    }

    const { data: solicitud, error: solicitudError } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (solicitudError) {
        console.error('Error buscando la solicitud:', solicitudError);
        return res.status(500).json({ error: 'No se pudo aprobar la solicitud.' });
    }
    if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }
    if (solicitud.estado !== 'pendiente') {
        return res.status(409).json({ error: 'Esta solicitud ya fue resuelta.' });
    }

    const { nombre, email, numero } = solicitud;
    const tempPassword = crypto.randomBytes(24).toString('base64');
    const ahora = new Date().toISOString();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
    });

    if (authError || !authData.user) {
        const yaExiste = authError?.message?.toLowerCase().includes('already been registered')
            || authError?.message?.toLowerCase().includes('already registered');

        if (yaExiste) {
            return res.status(409).json({ error: 'Ya existe una cuenta con ese email.' });
        }

        console.error('Error creando usuario de prueba en auth:', authError);
        return res.status(400).json({ error: authError?.message || 'No se pudo crear la cuenta de prueba.' });
    }

    const userId = authData.user.id;

    const { data: dbUser, error: dbError } = await supabase
        .from('Users')
        .insert({
            id: userId,
            nombre,
            email,
            numero,
            rol: 'Prueba',
            estado: true,
            pruebaInicio: ahora,
        })
        .select()
        .single();

    if (dbError) {
        console.error('Error insertando usuario de prueba en la tabla Users:', dbError);
        await supabase.auth.admin.deleteUser(userId);
        return res.status(500).json({ error: 'No se pudo registrar la cuenta de prueba.' });
    }

    const { error: updateError } = await supabase
        .from(TABLE)
        .update({ estado: 'aprobada', resueltaAt: ahora })
        .eq('id', id);

    if (updateError) {
        console.error('Usuario creado, pero no se pudo marcar la solicitud como aprobada:', updateError);
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) {
        console.error('Usuario de prueba creado, pero fallo el envio del mail:', resetError);
    }

    res.status(200).json(dbUser);
};

// Solo admin.
export const rejectTrialRequest = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Id invalido.' });
    }

    const { data, error } = await supabase
        .from(TABLE)
        .update({ estado: 'rechazada', resueltaAt: new Date().toISOString() })
        .eq('id', id)
        .eq('estado', 'pendiente')
        .select();

    if (error) {
        console.error('Error rechazando la solicitud:', error);
        return res.status(500).json({ error: 'No se pudo rechazar la solicitud.' });
    }
    if (!data || data.length === 0) {
        return res.status(404).json({ error: 'Solicitud no encontrada o ya resuelta.' });
    }

    res.status(200).json({ success: true });
};
