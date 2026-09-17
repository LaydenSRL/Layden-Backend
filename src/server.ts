import express from "express";
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import planillaRouter from "./routes/planillaRouter";
import embutidosRouter from "./routes/embutidosRouter";
import usersRouter from "./routes/usersRouter";
import trialRouter from "./routes/trialRouter";
import { requireAuth } from "./middleware/auth";

const app = express();

app.set('trust proxy', 1);
app.use(helmet());

const allowed_origins = [
    'http://localhost:5173',
    'https://layden.vercel.app',
    'https://layden-backend.vercel.app',
    'https://layden.com.ar'
];

// Vite cambia de puerto solo (5173, 5174, 5175...) si el de al lado ya
// esta ocupado -paso todo el tiempo con varias sesiones/servidores locales
// corriendo en paralelo. En produccion esto no aplica, ahi se respeta el
// whitelist de arriba a rajatabla.
const isLocalhostOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

const corsOptions: CorsOptions = {
    origin: function (origin, callback) {
        const esDev = process.env.NODE_ENV !== 'production';

        if (!origin || allowed_origins.indexOf(origin) !== -1 || (esDev && isLocalhostOrigin(origin))) {
            callback(null, true);
        } else {
            callback(new Error('Error de Cors'));
        }
    },
    methods: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Limite general de requests por IP, para mitigar abuso/fuerza bruta contra
// el API. 300 req / 5 min es holgado para uso normal de la app.
const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Todas las rutas de negocio requieren un usuario autenticado (Supabase JWT
// verificado en requireAuth). La autorizacion fina (dueño del recurso vs
// admin) se resuelve dentro de cada router/handler.
app.use('/api/planilla', requireAuth, planillaRouter);
app.use('/api/embutidos', requireAuth, embutidosRouter);
app.use('/api/users', requireAuth, usersRouter);
// Publica: es como se registra alguien que todavia no tiene cuenta.
app.use('/api/trial-signup', trialRouter);

export default app;
