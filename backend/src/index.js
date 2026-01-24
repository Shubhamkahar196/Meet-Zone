import express from 'express';
import cors from 'cors'
import dotenv from 'dotenv'
import connectDb from './db/config.js';
dotenv.config();



import UserRouter from './routes/user.route.js'

const app = express();

const port = process.env.PORT || 3000;

await connectDb()

app.use(express.json());

app.use("/api/v1/user",UserRouter)


app.listen(port,()=>{
    console.log(`Server is running on ${port}`)
})



