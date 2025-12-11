import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from pymongo import MongoClient
import joblib 

# ----------------------------------------------------------------------
# 1. CONFIGURATION - CRITICAL UPDATE
# ----------------------------------------------------------------------
MONGO_URI = "mongodb://localhost:27017/dashboard"  
DB_NAME = "dashboard" 
COLLECTION_NAME = "datapoints" 

TARGET_DATA = "aqi"
# *** FINAL CORRECTION: Using the standard lowercase key 'pm2_5' ***
FEATURE_KEY_INSIDE_COMPONENTS = "pm2_5" 
MODEL_FILENAME = 'linear_regression_aqi_model.joblib'
FLAT_FEATURE_COLUMN = 'pm25_flat' 

# ----------------------------------------------------------------------
# 2. DATA RETRIEVAL (MongoDB)
# ----------------------------------------------------------------------
print("Connecting to MongoDB and fetching data...")
try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    cursor = collection.find({})
    data = pd.DataFrame(list(cursor))
    client.close()
    print(f"Successfully loaded {len(data)} documents from MongoDB.")

except Exception as e:
    print(f"Error connecting to MongoDB or fetching data: {e}")
    exit()

# ----------------------------------------------------------------------
# 3. DATA PREPARATION AND CLEANING (Final Fix: Correct Key + Robust Cleaning)
# ----------------------------------------------------------------------

# A. FLATTENING FIX: Create a simple column for the nested data.
print("Flattening nested 'components' column...")
# This uses the assumed correct key 'pm2_5'
data[FLAT_FEATURE_COLUMN] = data['components'].apply(
    lambda x: x.get(FEATURE_KEY_INSIDE_COMPONENTS) if isinstance(x, dict) else None
)

# B. DATA TYPE CONVERSION AND IMPUTATION (SOLVES THE NON-NUMERIC ERROR)

# 1. CRITICAL CLEANING: Convert the column to string and strip spaces.
data[FLAT_FEATURE_COLUMN] = data[FLAT_FEATURE_COLUMN].astype(str).str.strip()

# 2. Convert to numeric, coercing any problematic values (like units or empty strings) to NaN.
data[FLAT_FEATURE_COLUMN] = pd.to_numeric(data[FLAT_FEATURE_COLUMN], errors='coerce')


# 3. Calculate the mean 
pm25_mean = data[FLAT_FEATURE_COLUMN].mean()

# Check if the mean is valid (meaning at least one valid number was found)
if pd.isna(pm25_mean):
    print("FATAL ERROR: All PM2.5 values are non-numeric or missing. Cannot calculate mean.")
    print(f"HINT: Check MongoDB for the exact key inside 'components'. Was it '{FEATURE_KEY_INSIDE_COMPONENTS}'?")
    exit()

# 4. Fill the remaining NaNs with the calculated mean
data[FLAT_FEATURE_COLUMN].fillna(pm25_mean, inplace=True)
print(f"Filled missing PM2.5 values with the mean ({pm25_mean:.2f}).")


# C. FINAL CLEANING
# Now we only drop samples where the target (aqi) might be missing.
data.dropna(subset=[TARGET_DATA], inplace=True) 
print(f"Data points available for training: {len(data)}")


# D. Define the Target (y) and Feature (X)
y = data[TARGET_DATA].values
X = data[FLAT_FEATURE_COLUMN].values.reshape(-1, 1)

# E. Split data for training and testing
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)


# ----------------------------------------------------------------------
# 4. MODEL TRAINING AND EVALUATION
# ----------------------------------------------------------------------
print("Starting Linear Regression model training...")
model = LinearRegression()
model.fit(X_train, y_train)

# Make predictions on the test set
y_pred = model.predict(X_test)

# Calculate key metrics
mse = mean_squared_error(y_test, y_pred)
r2 = r2_score(y_test, y_pred)


# ----------------------------------------------------------------------
# 5. PREDICTION EXAMPLE AND SUMMARY
# ----------------------------------------------------------------------

average_pm25 = data[FLAT_FEATURE_COLUMN].mean()
X_new_single = np.array([[average_pm25]])
one_prediction = model.predict(X_new_single)
final_prediction = one_prediction[0]

print("-" * 50)
print("MODEL TRAINING COMPLETE")
print("-" * 50)
print(f"R-squared (R2 Score on Test Set): {r2:.4f}")
print(f"Mean Squared Error (MSE): {mse:.4f}")
print(f"Current Avg PM2.5 used for prediction: {average_pm25:.2f}")
print(f"*** FINAL PREDICTED AQI based on average: {final_prediction:.2f} ***")
print("-" * 50)


# ----------------------------------------------------------------------
# 6. MODEL PERSISTENCE (Saving the Model for FastAPI)
# ----------------------------------------------------------------------

joblib.dump(model, MODEL_FILENAME)
print(f"\nModel successfully saved as: {MODEL_FILENAME}")