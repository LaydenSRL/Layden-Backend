import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabaseConfig';

export interface AuthedRequest extends Request {
    user?: {
        id: string;
        email?: string;
        rol?: string;
    };
}

/**
 * Verifica el JWT de Supabase que manda el frontend (src/services/apiClient.ts)
 * en el header Authorization: Bearer <access_token>. Rechaza con 401 si falta
 * o no es valido. En caso de exito, deja en req.user el id y el rol (leido de
 * la tabla Users) del usuario autenticado, para que los handlers lo usen en
 * vez de confiar en un clienteId que venga del body/params del request.
 */
export const requireAuth = async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No autorizado: falta el token de sesion.' });
    }

    const token = authHeader.slice('Bearer '.length).trim();

    try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
            return res.status(401).json({ error: 'No autorizado: token invalido o vencido.' });
        }

        const { data: perfil } = await supabase
            .from('Users')
            .select('rol, estado')
            .eq('id', data.user.id)
            .single();

        if (perfil && perfil.estado === false) {
            return res.status(403).json({ error: 'La cuenta esta deshabilitada.' });
        }

        req.user = {
            id: data.user.id,
            email: data.user.email,
            rol: perfil?.rol,
        };

        next();
    } catch (error) {
        console.error('Error verificando el token:', error);
        res.status(401).json({ error: 'No autorizado: no se pudo verificar el token.' });
    }
};

/** Como requireAuth, pero exige ademas rol === 'admin'. Usar despues de requireAuth. */
export const requireAdmin = (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (req.user?.rol !== 'admin') {
        return res.status(403).json({ error: 'No tenes permisos para realizar esta accion.' });
    }
    next();
};

/**
 * Para rutas con :clienteId en la URL: exige que sea el propio usuario
 * autenticado, salvo que sea admin (el equipo de Layden necesita ver
 * obras de cualquier cliente).
 */
export const requireOwnClienteId = (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (req.user?.rol === 'admin') return next();

    if (req.params.clienteId !== req.user?.id) {
        return res.status(403).json({ error: 'No tenes permisos para ver los datos de este cliente.' });
    }

    next();
};
