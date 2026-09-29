import pandas as pd
import torch
import json
import joblib
import sys
import os

# Add models directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'models'))

from model import SurgePredictorMLP
from preprocessing import clean_data, encode_features

# Load saved artifacts once
model_dir = os.path.join(os.path.dirname(__file__), '..', 'models')

with open(os.path.join(model_dir, "model_columns.json"), "r") as f:
    model_columns = json.load(f)

scaler = joblib.load(os.path.join(model_dir, "surge_scaler.pkl"))

# Initialize model with correct input dimension
input_dim = len(model_columns)
model = SurgePredictorMLP(input_dim=input_dim)
model.load_state_dict(torch.load(os.path.join(model_dir, "surge_model_weights.pth")))
model.eval()  # Set to evaluation mode

def predict_surge(data):
    # Convert incoming object to DataFrame
    payload = data if isinstance(data, dict) else data.dict()
    df = pd.DataFrame([payload])
    
    # Clean data (drop unnecessary columns, handle missing values)
    df_clean = clean_data(df, is_training=False)
    
    # Encode features (one-hot encoding + align to training columns)
    df_encoded = encode_features(df_clean, training_columns=model_columns)
    
    # Scale input
    df_scaled = scaler.transform(df_encoded)
    
    # Convert to tensor
    input_tensor = torch.tensor(df_scaled, dtype=torch.float32)
    
    # Predict
    with torch.no_grad():
        prediction = model(input_tensor)
    
    return float(prediction.item())