import { Server } from 'socket.io'
import udp from 'dgram'
import 'dotenv/config'

const port = process.env.PORT || 3000
const app = new Server(port)
const server = udp.createSocket('udp4')

server.bind(3000)
