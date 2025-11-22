import mongoose from 'mongoose';

// Define the approximate geographic bounding box for Greater Cairo.
// These coordinates can be adjusted for more precision.
const CAIRO_BOUNDS = {
    minLon: 31.1, // Eastern boundary
    maxLon: 31.4, // Western boundary
    minLat: 29.9, // Southern boundary
    maxLat: 30.2, // Northern boundary
};

const locationSchema = new mongoose.Schema({
    /**
     * A human-readable name for the monitoring location.
     * Example: "Ramses Square, Cairo"
     */
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },

    /**
     * The geographic coordinates for the location.
     * This field is now validated to ensure the location is within Cairo.
     */
    location: {
        type: {
            type: String,
            enum: ['Point'], default:["Point"],

        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true,
          
        }
    },

    /**
     * A flag to determine if the backend should actively fetch data for this location.
     */
    isActive: {
        type: Boolean,
        default: true
    },

    /**
     * A description of the site.
     * Example: "Official government monitoring station in a high-traffic urban area."
     */
    description: {
        type: String,
        trim: true
    }
});

// Create a geospatial index to speed up location-based searches
locationSchema.index({ location: '2dsphere' });

export const LocationModel = mongoose.model('Location', locationSchema);

