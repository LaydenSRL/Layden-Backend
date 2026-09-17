import { Router } from 'express';
import { createUserAdmin, validateCreateUser } from '../handlers/users';
import { requireAdmin } from '../middleware/auth';

const usersRouter = Router();

// requireAuth ya corre al montar este router en server.ts. Por ahora solo
// se movio "crear usuario" al backend (era la operacion insegura); listar,
// editar, desactivar y resetear password siguen resolviendose desde el
// cliente contra Supabase directamente.
usersRouter.post('/', requireAdmin, validateCreateUser, createUserAdmin);

export default usersRouter;
