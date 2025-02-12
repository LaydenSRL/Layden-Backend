import app from './server'
import http from 'http'

const port = process.env.PORT || 3001
const server = http.createServer(app);

server.listen(port, () => {
    console.log(`API en el puerto ${port}`)
})