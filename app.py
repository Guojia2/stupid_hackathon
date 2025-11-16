from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for local development

# Load model and features at startup
try:
    model = joblib.load('tuned_lr_adult_aq10.joblib')
    features = joblib.load('adult_features_aq10.joblib')
    print("✓ Model and features loaded successfully")
    print(f"✓ Model type: {type(model)}")
    print(f"✓ Expected features: {features}")
except Exception as e:
    print(f"✗ Error loading model: {e}")
    model = None
    features = None

@app.route('/')
def home():
    return jsonify({
        'status': 'running',
        'model_loaded': model is not None,
        'endpoints': {
            'predict': '/predict (POST)',
            'health': '/health (GET)'
        }
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.json
        responses = data.get('responses')
        
        if not responses:
            return jsonify({'error': 'No responses provided'}), 400
        
        # Convert responses to feature vector
        feature_vector = convert_responses_to_features(responses)
        
        # Calculate traditional AQ-10 score
        aq10_score = calculate_aq10_score(responses)
        
        # Run model inference
        prediction = model.predict([feature_vector])[0]
        probabilities = model.predict_proba([feature_vector])[0]
        
        # Prepare response
        result = {
            'aq10_score': int(aq10_score),
            'model_prediction': int(prediction),
            'model_probabilities': {
                'no_autism': float(probabilities[0]),
                'autism': float(probabilities[1])
            },
            'feature_vector': feature_vector,
            'interpretation': interpret_results(aq10_score, prediction, probabilities)
        }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error during prediction: {e}")
        return jsonify({'error': str(e)}), 500

def convert_responses_to_features(responses):
    """
    Convert questionnaire responses to binary feature vector.
    
    AQ-10 Scoring:
    - Questions 1, 7, 8, 10: Score 1 if Definitely/Slightly Agree
    - Questions 2, 3, 4, 5, 6, 9: Score 1 if Definitely/Slightly Disagree
    """
    features = [0] * 10  # Initialize all features to 0
    
    # Questions where Agree = 1 (indices 0, 6, 7, 9)
    agree_questions = [1, 7, 8, 10]
    for q in agree_questions:
        response = responses.get(f'q{q}', '')
        if response in ['definitely-agree', 'slightly-agree']:
            features[q - 1] = 1  # q1 → index 0, q7 → index 6, etc.
    
    # Questions where Disagree = 1 (indices 1, 2, 3, 4, 5, 8)
    disagree_questions = [2, 3, 4, 5, 6, 9]
    for q in disagree_questions:
        response = responses.get(f'q{q}', '')
        if response in ['definitely-disagree', 'slightly-disagree']:
            features[q - 1] = 1
    
    return features

def calculate_aq10_score(responses):
    """Calculate the traditional AQ-10 score (0-10)."""
    score = 0
    
    # Questions where Agree scores 1 point
    agree_questions = [1, 7, 8, 10]
    for q in agree_questions:
        response = responses.get(f'q{q}', '')
        if response in ['definitely-agree', 'slightly-agree']:
            score += 1
    
    # Questions where Disagree scores 1 point
    disagree_questions = [2, 3, 4, 5, 6, 9]
    for q in disagree_questions:
        response = responses.get(f'q{q}', '')
        if response in ['definitely-disagree', 'slightly-disagree']:
            score += 1
    
    return score

def interpret_results(aq10_score, prediction, probabilities):
    """Provide interpretation of the results."""
    autism_probability = probabilities[1]
    
    interpretation = {
        'aq10_interpretation': 'High likelihood' if aq10_score >= 6 else 'Low likelihood',
        'aq10_threshold': '6 or above suggests referral for assessment',
        'model_interpretation': 'Positive screening' if prediction == 1 else 'Negative screening',
        'confidence': f"{max(probabilities) * 100:.1f}%",
        'agreement': 'Results agree' if (aq10_score >= 6) == (prediction == 1) else 'Results differ'
    }
    
    return interpretation

if __name__ == '__main__':
    print("\n" + "="*50)
    print("🚀 Starting AQ-10 Autism Screening API")
    print("="*50)
    print("📍 Server will run at: http://localhost:5000")
    print("📊 Endpoints available:")
    print("   - GET  /health  → Check if model is loaded")
    print("   - POST /predict → Run inference on questionnaire")
    print("="*50 + "\n")
    
    app.run(debug=True, port=5001, host='0.0.0.0')