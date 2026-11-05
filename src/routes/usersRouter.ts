import { Router } from 'express';
import { acceptTerms, createUserAdmin, validateAcceptTerms, validateCreateUser } from '../handlers/users';
import { requireAdmin } from '../middleware/auth';

const usersRouter = Router();

// requireAuth ya corre al montar este router en server.ts. Por ahora solo
// se movio "crear usuario" al backend (era la operacion insegura); listar,
// editar, desactivar y resetear password siguen resolviendose desde el
// cliente contra Supabase directamente.
usersRouter.post('/', requireAdmin, validateCreateUser, createUserAdmin);
// Cualquier usuario logueado, sobre su propia fila.
usersRouter.post('/me/terminos', validateAcceptTerms, acceptTerms);

export default usersRouter;
