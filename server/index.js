import { Server } from 'socket.io'
import 'dotenv/config'

const port = process.env.PORT || 3000
const app = new Server(port, {
  cors: {
    origin: '*'
  }
})
