import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score
from pymongo import MongoClient
import joblib 

# ----------------------------------------------------------------------
# 1. CONFIGURATION - UPDATE THESE CONSTANTS
# ----------------------------------------------------------------------
# The URI and DB_NAME are now set based on your provided context
MONGO_URI = "mongodb://localhost:27017/dashboard"  
DB_NAME = "dashboard" 
COLLECTION_NAME = "datapoints" 

# Target column is correct. The FEATURE_DATA variable will now hold 
# the name of the *newly created flat column*.
TARGET_DATA = "aqi"
FEATURE_KEY_INSIDE_COMPONENTS = "PM2.5" # <--- The key INSIDE the 'components' dict
MODEL_FILENAME = 'linear_regression_aqi_model.joblib'
FLAT_FEATURE_COLUMN = 'pm25_flat' # <-- The new, clean column name

# ----------------------------------------------------------------------
# 2. DATA RETRIEVAL (MongoDB)
# ----------------------------------------------------------------------
print("Connecting to MongoDB and fetching data...")
try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    collection = db[COLLECTION_NAME]

    # Fetch all documents and load them into a Pandas DataFrame
    cursor = collection.find({})
    data = pd.DataFrame(list(cursor))
    client.close()
    print(f"Successfully loaded {len(data)} documents from MongoDB.")

except Exception as e:
    print(f"Error connecting to MongoDB or fetching data: {e}")
    print("Please check your MONGO_URI, DB_NAME, and COLLECTION_NAME.")
    exit()

# ----------------------------------------------------------------------
# 3. DATA PREPARATION AND CLEANING (WITH FLATTENING FIX)
# ----------------------------------------------------------------------

# A. FLATTENING FIX: Create a simple column for the nested data.
# This resolves the KeyError you faced previously.
print("Flattening nested 'components' column...")
data[FLAT_FEATURE_COLUMN] = data['components'].apply(
    # Extract the value using the key 'PM2.5' only if the column content is a dict
    lambda x: x.get(FEATURE_KEY_INSIDE_COMPONENTS) if isinstance(x, dict) else None
)

# B. Clean Missing Data (CRITICAL for Scikit-learn)
# Use the new, flat column name for checking NaNs.
data.dropna(subset=[TARGET_DATA, FLAT_FEATURE_COLUMN], inplace=True) 
print(f"Data points after cleaning NaNs: {len(data)}")

# C. Define the Target (y) and Feature (X)
y = data[TARGET_DATA].values
# Use the new flat column for the feature data
X = data[FLAT_FEATURE_COLUMN].values.reshape(-1, 1)

# D. Split data for training and testing
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

# Use the average PM2.5 from the historical data for a single prediction test
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

# Save the trained model to a .joblib file
joblib.dump(model, MODEL_FILENAME)
print(f"\nModel successfully saved as: {MODEL_FILENAME}")