import express from "express";
import { bootstrap } from "./src/app.controller.js";
import cors from "cors";
import { createServer } from 'http';
import { Server } from 'socket.io';
import startDataFetching from "./src/modules/openWeatherApiFetching/openWeather.service.js";
import { dataPointModel } from "./src/DB/dataPoint/dataPoint.schema.js";

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

// --- CACHE: Store the latest data fetched from the database ---
let latestData = null;

// Bootstrapping (DB connection, routes, etc.)
bootstrap(app, express);

// --- SOCKET.IO CONNECTION ---
io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);

    // If we have cached data, send it immediately to the new client
    if (latestData) {
        console.log("Sending cached data to new user");
        socket.emit('new-data', latestData);
    } else {
        // If cache is empty, load the latest saved record from MongoDB
        const lastRecord = await dataPointModel
            .findOne()
            .populate("location")
            .sort({ timestamp: -1 });

        if (lastRecord) {
            socket.emit("new-data", lastRecord);
            latestData = lastRecord; // fill cache for next users
            console.log("Sent last saved DB record to new user");
        }
    }
});

// --- START FETCHING WEATHER DATA ---
startDataFetching(io, (newDataFromFetch) => {
    latestData = newDataFromFetch;  // update cache
    // console.log("Cache updated with newest AQI");
});

// --- START SERVER ---
httpServer.listen(5001, () => {
    console.log('Backend server running on http://localhost:5001');
});
