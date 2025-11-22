import axios from 'axios';
import { LocationModel } from '../../DB/location/location.schema.js';
import { dataPointModel } from '../../DB/dataPoint/dataPoint.schema.js';

const fetchAndStoreData = async (io, onNewData) => {
    const locations = await LocationModel.find({ isActive: true });
    if (!locations) {
        return;
    }

    for (const location of locations) {
        const [long, lat] = location.location.coordinates;
        const apiKey = "85d02ab78d8a49379eee905e1e85ae01";
        const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${long}&appid=${apiKey}`;

        const response = await axios.get(url);
        const data = response.data.list[0];

        if (!data) {
            console.log(`No data from API for ${location.name}`);
            continue;
        }

        const newDataPoints = new dataPointModel({
            location: location._id,
            aqi: data.main.aqi,
            components: data.components,
            timestamp: new Date(data.dt * 1000)
        });

        await newDataPoints.save();

        const populated = await dataPointModel.findById(newDataPoints._id).populate("location");

        // Emit to all connected clients
        io.emit("new-data", populated);

        // ALSO send to index.js so it can be cached
        onNewData(populated);
    }
};

const startDataFetching = (io, onNewData) => {
    console.log("data fetching started");

    fetchAndStoreData(io, onNewData);

    setInterval(() => {
        fetchAndStoreData(io, onNewData);
    }, 300000);
};

export default startDataFetching;
