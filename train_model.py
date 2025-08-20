import numpy as np
import librosa
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
import joblib
from pathlib import Path

# Constants
SAMPLE_RATE = 22050
DURATION = 5  # seconds
HOP_LENGTH = 512
N_MELS = 128

def extract_features(audio_path):
    """Extract mel-spectrogram features from an audio file."""
    try:
        # Always load the same number of samples
        y, sr = librosa.load(audio_path, sr=SAMPLE_RATE)
        target_length = SAMPLE_RATE * DURATION
        if len(y) < target_length:
            # Pad with zeros if too short
            y = np.pad(y, (0, target_length - len(y)))
        else:
            # Trim if too long
            y = y[:target_length]

        # Compute mel-spectrogram
        mel_spec = librosa.feature.melspectrogram(
            y=y,
            sr=sr,
            n_mels=N_MELS,
            hop_length=HOP_LENGTH
        )

        # Convert to log scale
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)

        # Normalize
        mel_spec_norm = (mel_spec_db - mel_spec_db.min()) / (mel_spec_db.max() - mel_spec_db.min())

        return mel_spec_norm.reshape(1, -1)
    except Exception as e:
        print(f"Error processing {audio_path}: {str(e)}")
        return None


def load_dataset(data_dir):
    """Load audio files and their labels from the data directory."""
    features = []
    labels = []
    expected_shape = None

    for category in os.listdir(data_dir):
        category_path = os.path.join(data_dir, category)
        if not os.path.isdir(category_path):
            continue
            
        print(f"Processing {category} sounds...")
        for audio_file in os.listdir(category_path):
            if not audio_file.endswith(('.wav', '.mp3')):
                continue
                
            audio_path = os.path.join(category_path, audio_file)
            feature = extract_features(audio_path)
            
            if feature is not None:
                # Set expected shape from the first valid feature
                if expected_shape is None:
                    expected_shape = feature.shape
                # Only add features with the correct shape
                if feature.shape == expected_shape:
                    features.append(feature.flatten())
                    labels.append(category)
                else:
                    print(f"Skipping {audio_path}: unexpected feature shape {feature.shape}, expected {expected_shape}")
            else:
                print(f"Skipping {audio_path}: feature extraction failed")

    if not features:
        raise ValueError("No valid features found in dataset.")

    features = np.stack(features)
    labels = np.array(labels)
    return features, labels

def train_model():
    """Train the cat sound classifier model."""
    # Create models directory if it doesn't exist
    Path('models').mkdir(exist_ok=True)
    
    # Load training data
    print("Loading training data...")
    train_dir = os.path.join('data', 'train')
    X_train, y_train = load_dataset(train_dir)
    
    # Load test data
    print("Loading test data...")
    test_dir = os.path.join('data', 'test')
    X_test, y_test = load_dataset(test_dir)
    
    # Encode labels
    label_encoder = LabelEncoder()
    y_train_encoded = label_encoder.fit_transform(y_train)
    y_test_encoded = label_encoder.transform(y_test)
    
    # Train model
    print("Training model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train_encoded)
    
    # Evaluate model
    train_score = model.score(X_train, y_train_encoded)
    test_score = model.score(X_test, y_test_encoded)
    
    print(f"Training accuracy: {train_score:.2f}")
    print(f"Test accuracy: {test_score:.2f}")
    
    # Save model and label encoder
    print("Saving model...")
    joblib.dump(model, 'models/cat_sound_classifier.joblib')
    joblib.dump(label_encoder, 'models/label_encoder.joblib')
    
    print("Training complete!")

if __name__ == "__main__":
    train_model()
