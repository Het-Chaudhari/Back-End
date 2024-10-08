import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({
    path:'./.env'
})
//const app=express();

connectDB()
.then(()=>{
   app.listen(process.env.PORT || 8000 , ()=>{
    console.log(`app is listing at port ${process.env.PORT} `);
   }) 
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})

