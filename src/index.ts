import app from './server'
import http from 'http'

// server.ts ya no llama a .listen() por su cuenta (antes lo hacia con el
// puerto 3001 hardcodeado, ademas de este listen acá -quedaban dos
// servidores escuchando a la vez). 3001 sigue siendo el default para no
// romper VITE_API_URL en desarrollo; en Vercel/produccion el PORT lo
// inyecta la plataforma.
const port = process.env.PORT || 3001
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`API en el puerto ${port}`)
})