import express from "express";
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import db from './config/db';
import planillaRouter from "./routes/planillaRouter";
import embutidosRouter from "./routes/embutidosRouter";
import { requireAuth } from "./middleware/auth";

export async function connectDB() {
    try {
        // alter:true reescribe el esquema para calzar con los modelos en cada
        // arranque -util en desarrollo, pero riesgoso en producción (puede
        // alterar columnas sin revision humana). Fuera de desarrollo solo
        // verificamos la conexion; los cambios de esquema en producción se
        // aplican a mano (ver migraciones/SQL).
        const alter = process.env.NODE_ENV !== 'production';
        await db.sync({ alter });
        console.log(`Database synchronized${alter ? ' (alter=true, modo desarrollo)' : ''}`);
    } catch (error) {
        console.log('ERROR AL CONECTAR CON LA DB:', error);
    }
}

connectDB();

const app = express();

app.set('trust proxy', 1);
app.use(helmet());

const allowed_origins = [
    'http://localhost:5173',
    'https://layden.vercel.app',
    'https://layden-backend.vercel.app',
    'https://layden.com.ar'
];

const corsOptions: CorsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowed_origins.indexOf(origin) !== -1) {
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

export default app;
