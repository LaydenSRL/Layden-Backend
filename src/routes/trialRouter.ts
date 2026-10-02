import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
    approveTrialRequest,
    createTrialRequest,
    listTrialRequests,
    rejectTrialRequest,
    validateTrialSignup,
} from '../handlers/trial';
import { requireAdmin, requireAuth } from '../middleware/auth';

const trialRouter = Router();

// El POST es publico (sin requireAuth: todavia no existe usuario). Limite
// propio y mas estricto que el general de /api, porque cada pedido le manda un
// mail al equipo.
const trialSignupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Probá de nuevo mas tarde.' },
});

trialRouter.post('/', trialSignupLimiter, validateTrialSignup, createTrialRequest);

// El resto es solo para el equipo: ver, aprobar y rechazar solicitudes.
trialRouter.get('/', requireAuth, requireAdmin, listTrialRequests);
trialRouter.post('/:id/approve', requireAuth, requireAdmin, approveTrialRequest);
trialRouter.post('/:id/reject', requireAuth, requireAdmin, rejectTrialRequest);

export default trialRouter;
