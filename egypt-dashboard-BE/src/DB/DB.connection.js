import mongoose from "mongoose";
export const connectDB=async() =>{
await  mongoose.connect("mongodb://localhost:27017/dashboard").then(()=>{console.log("connected to db")}).catch((error)=>{console.log(error + "can not connect to the database")});

}