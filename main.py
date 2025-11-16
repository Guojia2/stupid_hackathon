import joblib
import numpy as np

# Load your model
model = joblib.load('tuned_lr_children_reduced.joblib')  # Replace with your actual filename

# Print model information
print("=== MODEL INFORMATION ===")
print("\nCoefficients:", model.coef_[0])
print("\nIntercept:", model.intercept_[0])

# Check if feature names are stored
if hasattr(model, 'feature_names_in_'):
    print("\nFeature names:", model.feature_names_in_)
else:
    print("\nFeature names not stored in model")
    print("Number of features:", len(model.coef_[0]))