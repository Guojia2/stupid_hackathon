import joblib
import numpy as np

# Define the path to the adult model
adult_model_path = 'tuned_lr_adult_aq10.joblib'  # Update with your actual filename
adult_features_path = 'adult_features_aq10.joblib'  # Update with your actual filename

# Load the saved model and features
loaded_model = joblib.load(adult_model_path)
loaded_features = joblib.load(adult_features_path)

print(f"Successfully loaded model from '{adult_model_path}'")
print(f"Successfully loaded feature names from '{adult_features_path}'")

# Print the model details
print('\n--- Adult Model Details (A1-A10 Features) ---')
print('Type of loaded model:', type(loaded_model))
print('\nModel Coefficients:', loaded_model.coef_)
print('\nModel Intercept:', loaded_model.intercept_)
print('\nLoaded Feature Names:', loaded_features)