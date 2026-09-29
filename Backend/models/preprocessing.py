import pandas as pd
import numpy as np

def clean_data(df, is_training=True):
    """
    Cleans the dataset by handling missing values and dropping noise.
    Works for both training (bulk) and inference (single/batch rows).
    """
    df_clean = df.copy()

    # 1. Handle Missing 'Event' (Crucial for baseline demand)
    if 'Event' in df_clean.columns:
        df_clean['Event'] = df_clean['Event'].fillna('No Event')

    # 2. Handle missing rows differently based on the stage
    if is_training:
        # We know there's only 1 corrupted row in training, safe to drop
        df_clean = df_clean.dropna()
    else:
        # In production, NEVER drop a live customer request. Fill with safe defaults.
        num_cols = df_clean.select_dtypes(include=['number']).columns
        cat_cols = df_clean.select_dtypes(include=['object']).columns
        df_clean[num_cols] = df_clean[num_cols].fillna(df_clean[num_cols].median())
        df_clean[cat_cols] = df_clean[cat_cols].fillna(df_clean[cat_cols].mode().iloc[0])

    # 3. Target columns to drop based on our correlation analysis
    cols_to_drop = [
        'Date', 'Time_of_Day', 'Final_Fare', 'Latitude', 'Longitude',
        'Demand_Score', 'Driver_Availability', 'Leaderboard_Rank',
        'Driver_Trust_Score', 'Rider_Trust_Score', 'Driver_Performance_Score',
        'Is_Weekend', 'Ride_Priority','Cancellation_Probability', 'Payment_Type', 
        'Driver_XP', 'Fare_Acceptance', 'Cancellation_Rate'
    ]

    # Only drop columns if they exist (e.g., 'Final_Fare' won't exist in live inference)
    existing_cols_to_drop = [col for col in cols_to_drop if col in df_clean.columns]
    df_clean = df_clean.drop(columns=existing_cols_to_drop)

    return df_clean

def encode_features(df, training_columns=None):
    """
    One-hot encodes categoricals and aligns columns so inference data 
    perfectly matches the shape of the training data.
    """
    # 1. Define the categorical columns we kept
    categorical_cols = ['City', 'Ride_Type', 'Weather', 'Event']
    existing_cat_cols = [col for col in categorical_cols if col in df.columns]

    # 2. Perform One-Hot Encoding
    df_encoded = pd.get_dummies(df, columns=existing_cat_cols, drop_first=True)

    # 3. IF INFERENCE STAGE: Align the columns to the trained model
    if training_columns is not None:
        # Find columns the model expects but are missing from this new data (fill with 0)
        missing_cols = set(training_columns) - set(df_encoded.columns)
        for col in missing_cols:
            df_encoded[col] = 0
            
        # Reorder columns to match model expectations and drop any unexpected new columns
        df_encoded = df_encoded[training_columns]

    return df_encoded