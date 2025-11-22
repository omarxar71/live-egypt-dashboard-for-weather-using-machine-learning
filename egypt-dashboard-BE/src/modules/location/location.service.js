import { LocationModel } from "../../DB/location/location.schema.js"

export const createLocation = async(req , res , next)=>{
const {coordinates , name ,description}=req.body
try {
    if(!name , !coordinates){
        return res.status(400).json({message : "something is missing"})
    }
    const creatlocation = await LocationModel.create({name , description , location:{
        coordinates:coordinates,
        type:"Point"
    }})
    if(!creatlocation){
        return res.status(404).json({message : "couldn't create location"})
    }
    return res.status(200).json({message : "location is correct"})
} catch (error) {
     // Handle validation errors (e.g., outside Cairo, duplicate name)
     if (error.name === 'ValidationError' || error.code === 11000) {
        return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({message : "server error"})
}
}
export const getActiveLocations = async (req, res) => {
    try {
        const locations = await Location.find({ isActive: true });
        res.status(200).json({ data: locations });
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching locations.' });
    }
};

