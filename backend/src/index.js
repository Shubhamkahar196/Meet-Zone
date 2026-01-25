import express from 'express';
import cors from 'cors'
import dotenv from 'dotenv'
import connectDb from './db/config.js';
dotenv.config();
import createServer from 'socket.io'




import UserRouter from './routes/user.route.js'
import { connectToSocket } from './controller/socketManager.js';

const app = express();
const server = createServer(app)
const io = connectToSocket(server);

const port = process.env.PORT || 3000;

await connectDb()

app.use(express.json());
app.use(cors())

app.use("/api/v1/user",UserRouter)


app.listen(port,()=>{
    console.log(`Server is running on ${port}`)
})



