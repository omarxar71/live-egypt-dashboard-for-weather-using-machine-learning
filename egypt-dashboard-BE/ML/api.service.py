from fastapi import FastAPI, HTTPException
from pymongo import MongoClient
import joblib
import numpy as np
import pandas as pd

# ----------------------------------------------------------------------
# CONFIGURATION (Must match your training script and MongoDB)
# ----------------------------------------------------------------------
MODEL_FILENAME = 'linear_regression_aqi_model.joblib'
MONGO_URI = "mongodb://localhost:27017/dashboard"  
DB_NAME = "dashboard" 
COLLECTION_NAME = "datapoints" 
FEATURE_KEY_INSIDE_COMPONENTS = "pm2_5" # Key used for feature data in MongoDB

app = FastAPI()
model = None
mongo_client = None

# ----------------------------------------------------------------------
# LIFECYCLE HOOKS (Setup and Teardown)
# ----------------------------------------------------------------------

@app.on_event("startup")
def load_resources():
    """Load the trained model and establish the MongoDB connection."""
    global model, mongo_client
    
    # A. Load the Model
    try:
        model = joblib.load(MODEL_FILENAME)
        print(f"FastAPI: Model {MODEL_FILENAME} loaded successfully.")
    except Exception as e:
        # If the model file is missing, the service cannot run.
        print(f"FATAL ERROR: Could not load model file: {e}")
        raise RuntimeError("Model file not found or corrupted.")

    # B. Connect to MongoDB
    try:
        mongo_client = MongoClient(MONGO_URI)
        print("FastAPI: MongoDB connection established.")
    except Exception as e:
        print(f"FATAL ERROR: Could not connect to MongoDB: {e}")
        raise RuntimeError("Database connection failed.")

@app.on_event("shutdown")
def shutdown_db_client():
    """Close the MongoDB connection when the service shuts down."""
    if mongo_client:
        mongo_client.close()
        print("FastAPI: MongoDB connection closed.")

# ----------------------------------------------------------------------
# HELPER FUNCTION: GET LATEST DATA FROM DB
# ----------------------------------------------------------------------

def get_latest_pm25():
    """Fetches the single latest PM2.5 reading from MongoDB."""
    db = mongo_client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # Look for the single latest document
    latest_doc = collection.find_one(
        # Filter: check that the components field exists and is not null
        {"components": {"$exists": True, "$ne": None}}, 
        sort=[('_id', -1)] # Sort descending to get the newest document
    )

    if latest_doc and 'components' in latest_doc and isinstance(latest_doc['components'], dict):
        pm25_value = latest_doc['components'].get(FEATURE_KEY_INSIDE_COMPONENTS)
        
        # --- Apply the same robust cleaning as the training script ---
        if pm25_value is not None:
             # Convert to numeric, coercing any non-numeric values to NaN
             pm25_value = pd.to_numeric(
                 str(pm25_value).strip(), errors='coerce'
             )
             if not pd.isna(pm25_value):
                 return pm25_value
        # -----------------------------------------------------------
        
    return None

# ----------------------------------------------------------------------
# PREDICTION ENDPOINT (This is what your Express backend will call)
# ----------------------------------------------------------------------

@app.get("/api/forecast")
def get_aqi_forecast():
    """Fetches the latest data and predicts the AQI using the loaded model."""
    
    # 1. Retrieve the latest input feature value
    latest_pm25 = get_latest_pm25()
    
    if latest_pm25 is None:
        raise HTTPException(
            status_code=503, 
            detail="Cannot make prediction: Latest valid PM2.5 reading not found in the database."
        )
    
    # 2. Format the single input into the required 2D NumPy array
    X_new = np.array([[latest_pm25]])
    
    # 3. Make the prediction using the loaded model
    predicted_aqi = model.predict(X_new)
    
    # 4. Return the result
    return {
        "predicted_aqi": round(predicted_aqi[0], 2),
        "input_pm25": latest_pm25
    }