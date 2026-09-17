import crypto from 'crypto';
import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthedRequest } from '../middleware/auth';
import { supabase } from '../config/supabaseConfig';

const ROLES = ['pendientePago', 'alDia', 'debePagar', 'exCliente'];

export const validateCreateUser = [
    body('nombre').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres.'),
    body('email').trim().isEmail().withMessage('El email no es valido.'),
    body('numero').trim().isLength({ min: 6 }).withMessage('El numero de telefono no es valido.'),
    body('rol').isIn(ROLES).withMessage('Rol invalido.'),
];

// Crea el usuario desde el backend, con la service_role key, en vez de
// hacer supabase.auth.signUp() desde el navegador del admin: signUp()
// reemplaza la sesion activa del cliente que lo llama, lo que significaba
// que crear un usuario podia "desloguear" al admin y loguearlo como el
// usuario recien creado. Ademas ya no se manda una contraseña fija
// ("123456") - se genera una al azar que nunca se expone, y se le manda
// al usuario el mismo mail de "restablecer contraseña" que ya se usaba.
export const createUserAdmin = async (req: AuthedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nombre, email, numero, rol } = req.body;
    const tempPassword = crypto.randomBytes(24).toString('base64');

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
    });

    if (authError || !authData.user) {
        console.error('Error creando usuario en auth:', authError);
        return res.status(400).json({ error: authError?.message || 'No se pudo crear el usuario.' });
    }

    const userId = authData.user.id;

    const { data: dbUser, error: dbError } = await supabase
        .from('Users')
        .insert({
            id: userId,
            nombre,
            email,
            numero,
            rol,
            estado: true,
        })
        .select()
        .single();

    if (dbError) {
        console.error('Error insertando usuario en la tabla Users:', dbError);
        await supabase.auth.admin.deleteUser(userId);
        return res.status(500).json({ error: 'No se pudo registrar el usuario.' });
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) {
        console.error('Usuario creado, pero fallo el envio del mail de restablecimiento:', resetError);
    }

    res.status(201).json(dbUser);
};
