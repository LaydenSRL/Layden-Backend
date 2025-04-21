import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT;
export const POSTGRES_URL = process.env.POSTGRES_URL;
export const POSTGRES_PRISMA_URL = process.env.POSTGRES_PRISMA_URL;
export const POSTGRES_URL_NON_POOLING = process.env.POSTGRES_URL_NON_POOLING;
export const POSTGRES_USER = process.env.POSTGRES_USER;
export const POSTGRES_HOST = process.env.POSTGRES_HOST;
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
export const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;