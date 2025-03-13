import express from "express";
import cors, { CorsOptions } from 'cors';
import db from './config/db';
import planillaRouter from "./routes/planillaRouter";

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

const corsOptions: CorsOptions = {
    origin: function (origin, callback) {
        console.log('Origen de la solicitud:', origin);
        if (origin === 'http://localhost:5173' || origin === 'https://layden.vercel.app') {
            callback(null, true);
        } else {
            callback(new Error('Error de Cors'));
        }
    },
    methods: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

app.use('/api/planilla', planillaRouter)


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

export default app;