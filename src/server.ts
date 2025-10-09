import express from "express";
import cors, { CorsOptions } from 'cors';
import db from './config/db';
import planillaRouter from "./routes/planillaRouter";
import embutidosRouter from "./routes/embutidosRouter";

export async function connectDB() {
    try {
        await db.sync({ alter: true });
        console.log('Database synchronized');
    } catch (error) {
        console.log('ERROR AL CONECTAR CON LA DB:', error);
    }
}

connectDB();

const app = express();

const allowed_origins = [
    'http://localhost:5173',
    'https://layden.vercel.app',
    'https://layden-backend.vercel.app',
    'https://layden.com.ar'
];

const corsOptions: CorsOptions = {
    origin: function (origin, callback) {
        console.log('Origen de la solicitud:', origin);
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

app.use((req, res, next) => {
    console.log('Origin:', req.headers.origin);
    next();
});

app.use('/api/planilla', planillaRouter)
app.use('/api/embutidos', embutidosRouter);

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;