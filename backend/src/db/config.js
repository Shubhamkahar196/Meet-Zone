import mongoose   from 'mongoose'

const connectDb = async()=>{
    try {
        //  mongodb uri
         if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI missing");
    }
     const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)
      console.log(`\ MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
   }catch(error){
    console.log("MONGODB connection error", error);
    process.exit(1)
   }
    
}

export default connectDb