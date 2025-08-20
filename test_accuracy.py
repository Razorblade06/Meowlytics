# test_accuracy.py
import joblib
import numpy as np
from train_model import load_dataset
from sklearn.preprocessing import LabelEncoder

# Load model and encoder
model = joblib.load('models/cat_sound_classifier.joblib')
label_encoder = joblib.load('models/label_encoder.joblib')

# Load test data
X_test, y_test = load_dataset('data/test')
y_test_encoded = label_encoder.transform(y_test)

# Evaluate
accuracy = model.score(X_test, y_test_encoded)
print(f"Test accuracy: {accuracy:.2f}")