import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createTrialUser, validateTrialSignup } from '../handlers/trial';

const trialRouter = Router();

// Publica (sin requireAuth: todavia no existe usuario). Limite propio y mas
// estricto que el general de /api, porque crea cuentas reales de verdad.
const trialSignupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Probá de nuevo mas tarde.' },
});

trialRouter.post('/', trialSignupLimiter, validateTrialSignup, createTrialUser);

export default trialRouter;
