import { Sequelize } from "sequelize-typescript";
import pg from 'pg'
import { POSTGRES_DATABASE, POSTGRES_HOST_2, POSTGRES_PASSWORD, POSTGRES_USER } from "../config";

const db = new Sequelize({
    dialect: 'postgres',
    dialectModule: pg,
    host: POSTGRES_HOST_2,
    username: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    database: POSTGRES_DATABASE,
    port: 5432,
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    },
    models: [__dirname + '/../models/**/*'],
})

export default db