import tempfile
import os
import sys

# Simulate the Vercel serverless environment (no ffmpeg)
original_path = os.environ.get('PATH', '')

print("Testing librosa MP3 loading WITHOUT ffmpeg...")
print("=" * 60)

import librosa

mp3_file = r"data/train/Angry_Aug/car_extcoll0103_aug1(1).mp3"

try:
    y, sr = librosa.load(mp3_file, sr=22050, duration=5)
    print(f"✓ Loaded MP3: {len(y)} samples at {sr}Hz")
except Exception as e:
    print(f"✗ Error: {type(e).__name__}: {str(e)}")
    
    # Try with different backend
    print("\nTrying with soundfile backend directly...")
    try:
        import soundfile as sf
        data, sr = sf.read(mp3_file)
        print(f"✓ SoundFile loaded: {len(data)} samples")
    except Exception as e2:
        print(f"✗ SoundFile also failed: {type(e2).__name__}: {str(e2)}")

print("=" * 60)
