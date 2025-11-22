import { connectDB } from "./DB/DB.connection.js"
export const bootstrap =async(app , express)=>{
app.use(express.json())
connectDB()


}