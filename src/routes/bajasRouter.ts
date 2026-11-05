import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createBajaRequest, listBajaRequests, resolveBajaRequest, validateBaja } from '../handlers/bajas';
import { requireAdmin, requireAuth } from '../middleware/auth';

const bajasRouter = Router();

// Publico, con limite propio como el de la prueba (cada pedido avisa por mail).
const bajaLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Probá de nuevo mas tarde o escribinos a laydensrl@gmail.com.' },
});

bajasRouter.post('/', bajaLimiter, validateBaja, createBajaRequest);

bajasRouter.get('/', requireAuth, requireAdmin, listBajaRequests);
bajasRouter.post('/:id/resolve', requireAuth, requireAdmin, resolveBajaRequest);

export default bajasRouter;
