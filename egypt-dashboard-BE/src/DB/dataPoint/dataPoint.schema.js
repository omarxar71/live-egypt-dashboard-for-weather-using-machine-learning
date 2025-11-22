import mongoose from  "mongoose"

const dataPointSchema = new mongoose.Schema({
    /**
     * A reference to the specific Location document this data point belongs to.
     * This links our pollution reading to a specific place.
     */
    location: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true,
    },

    /**
     * The Air Quality Index (AQI). A number from 1 (Good) to 5 (Very Poor).
     * This gives an overall summary of the air quality.
     */
    aqi: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },

    /**
     * An object containing the concentration values for individual air pollutants.
     * All values are in μg/m³.
     */
    components: {
        co: { type: Number },    // Carbon monoxide
        no: { type: Number },    // Nitric oxide
        no2: { type: Number },   // Nitrogen dioxide
        o3: { type: Number },    // Ozone
        so2: { type: Number },   // Sulphur dioxide
        pm2_5: { type: Number }, // Fine particles matter
        pm10: { type: Number },  // Coarse particulate matter
        nh3: { type: Number },   // Ammonia
    },

    /**
     * The exact date and time when this data was recorded by the external API.
     */
    timestamp: {
        type: Date,
        required: true,
    },
});

/**
 * Creates a compound index on the location and timestamp fields.
 * This is a crucial performance optimization that makes it very fast to
 * find all data points for a specific location, sorted by time.
 */
dataPointSchema.index({ location: 1, timestamp: -1 });

export const dataPointModel = mongoose.model('DataPoint', dataPointSchema);

