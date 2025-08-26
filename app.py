from flask import Flask, render_template, request, jsonify
import numpy as np
import librosa
import joblib
from pathlib import Path
import os
import logging
import tempfile

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(
    __name__,
    template_folder=str(Path(__file__).parent / "templates"),
    static_folder=str(Path(__file__).parent / "static")
)

# Constants for audio processing
SAMPLE_RATE = 22050
DURATION = 5  # seconds
HOP_LENGTH = 512
N_MELS = 128

# Paths relative to project root
ROOT_DIR = Path(__file__).parent
MODEL_PATH = ROOT_DIR / 'models' / 'cat_sound_classifier.joblib'
ENCODER_PATH = ROOT_DIR / 'models' / 'label_encoder.joblib'
UPLOAD_DIR = ROOT_DIR / 'uploads'

# Load the trained model and label encoder at startup
model = None
label_encoder = None

if MODEL_PATH.exists() and ENCODER_PATH.exists():
    model = joblib.load(MODEL_PATH)
    label_encoder = joblib.load(ENCODER_PATH)
else:
    print("Warning: Model or label encoder not found. Classification will not work.")

# Ensure all required directories exist
def setup_directories():
    try:
        UPLOAD_DIR.mkdir(exist_ok=True)
        (ROOT_DIR / 'models').mkdir(exist_ok=True)
        return True
    except Exception as e:
        logger.error(f"Failed to create directories: {str(e)}")
        return False

# Validate model files
def validate_model_files():
    if not MODEL_PATH.exists():
        logger.error(f"Model file not found at {MODEL_PATH}")
        return False
    if not ENCODER_PATH.exists():
        logger.error(f"Encoder file not found at {ENCODER_PATH}")
        return False
    return True

# Initialize app
setup_directories()
if not validate_model_files():
    logger.error("Required model files are missing. Please ensure all files are present.")

def extract_features(audio_path):
    """Extract mel-spectrogram features from an audio file."""
    try:
        if not os.path.exists(audio_path):
            logger.error(f"Audio file not found at {audio_path}")
            return None, None

        y, sr = librosa.load(audio_path, sr=SAMPLE_RATE, duration=DURATION)
        if len(y) == 0:
            logger.error("Audio file is empty or corrupted")
            return None, None

        target_length = SAMPLE_RATE * DURATION
        if len(y) < target_length:
            y = np.pad(y, (0, target_length - len(y)))
        else:
            y = y[:target_length]

        # Get frequency data for visualization
        D = librosa.stft(y)
        mag_db = librosa.amplitude_to_db(abs(D))
        freq_data = {
            'frequencies': [float(f) for f in librosa.fft_frequencies(sr=sr)[:100]],
            'magnitudes': [float(m) for m in np.mean(mag_db, axis=1)[:100]]
        }

        mel_spec = librosa.feature.melspectrogram(
            y=y,
            sr=sr,
            n_mels=N_MELS,
            hop_length=HOP_LENGTH
        )
        mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
        mel_spec_norm = (mel_spec_db - mel_spec_db.min()) / (mel_spec_db.max() - mel_spec_db.min())
        
        return mel_spec_norm.reshape(1, -1), freq_data
    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}")
        return None, None

ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.errorhandler(404)
def not_found_error(error):
    return render_template('error.html', error='Page not found'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('error.html', error='Internal server error'), 500

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    if 'file' not in request.files:
        logger.warning("No file part in request")
        return jsonify({'error': 'No file uploaded', 'success': False}), 400

    file = request.files['file']
    if file.filename == '':
        logger.warning("No file selected")
        return jsonify({'error': 'No file selected', 'success': False}), 400

    if not allowed_file(file.filename):
        logger.warning(f"Invalid file type: {file.filename}")
        return jsonify({'error': 'Invalid file type. Please upload WAV, MP3, or OGG files', 'success': False}), 400

    try:
        # Use tempfile to safely handle uploaded files
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            file.save(tmp.name)
            features, freq_data = extract_features(tmp.name)
            if features is None:
                return jsonify({'error': 'Error processing audio file', 'success': False}), 400

            if model is None or label_encoder is None:
                return jsonify({'error': 'Model not loaded', 'success': False}), 500

            prediction = model.predict(features)
            probabilities = model.predict_proba(features)[0].tolist()  # Convert to list
            confidence = float(np.max(probabilities))  # Convert to native Python float
            predicted_class = str(label_encoder.inverse_transform(prediction)[0])  # Convert to string
            
            result = {
                'class': predicted_class,
                'confidence': round(float(confidence * 100), 2),  # Ensure float
                'success': True,
                'freq_data': {
                    'frequencies': [float(f) for f in freq_data['frequencies']],
                    'magnitudes': [float(m) for m in freq_data['magnitudes']]
                }
            }
            return jsonify(result)
    except Exception as e:
        logger.error(f"Error during analysis: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500
    finally:
        # Clean up temporary file
        try:
            os.unlink(tmp.name)
        except Exception as e:
            logger.error(f"Error deleting temporary file: {str(e)}")

# Update the app configuration
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
app.config['UPLOAD_FOLDER'] = str(UPLOAD_DIR)

if __name__ == '__main__':
    # Development mode with different port
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)), debug=True)