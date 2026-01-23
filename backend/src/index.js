import express from 'express';
import cors from 'cors'
import dotenv from 'dotenv'
import connectDb from './db/config.js';
dotenv.config();

const app = express();

const port = process.env.PORT || 3000;

await connectDb()


app.listen(port,()=>{
    console.log(`Server is running on ${port}`)
})



