import crypto from 'crypto';
import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabaseConfig';

export const validateTrialSignup = [
    body('nombre').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres.'),
    body('email').trim().isEmail().withMessage('El email no es valido.'),
    body('numero').trim().isLength({ min: 6 }).withMessage('El numero de telefono no es valido.'),
];

// Alta de un usuario de prueba desde el formulario publico del Home. Misma
// logica que createUserAdmin (handlers/users.ts): se crea con la
// service_role key -nunca con supabase.auth.signUp() desde un navegador,
// que reemplazaria cualquier sesion activa en esa pestaña-, con una
// contraseña al azar que nadie ve nunca, y se dispara el mismo mail de
// "restablecer contraseña" para que el usuario elija la suya. A diferencia
// de createUserAdmin: no requiere sesion (es publica), el rol siempre es
// 'Prueba' (no lo elige quien llama), y guarda pruebaInicio para poder
// calcular el vencimiento a los 30 dias en el frontend (ProtectedRoute).
export const createTrialUser = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nombre, email, numero } = req.body;
    const tempPassword = crypto.randomBytes(24).toString('base64');
    const pruebaInicio = new Date().toISOString();

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
            pruebaInicio,
        })
        .select()
        .single();

    if (dbError) {
        console.error('Error insertando usuario de prueba en la tabla Users:', dbError);
        await supabase.auth.admin.deleteUser(userId);
        return res.status(500).json({ error: 'No se pudo registrar la cuenta de prueba.' });
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) {
        console.error('Usuario de prueba creado, pero fallo el envio del mail:', resetError);
    }

    res.status(201).json({ success: true, nombre: dbUser.nombre, email: dbUser.email });
};
