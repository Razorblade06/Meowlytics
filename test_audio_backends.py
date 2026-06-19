import librosa
import os
import sys

print("=" * 60)
print("Testing Audio Backend Capabilities")
print("=" * 60)

# Check for audioread (needed for MP3)
try:
    import audioread
    print(f"✓ audioread available")
except ImportError:
    print("✗ audioread NOT available - MP3 support will fail!")
    print("  Install with: pip install audioread")

# Check for other backends
try:
    import soundfile
    print(f"✓ soundfile available")
except ImportError:
    print("✗ soundfile not available")

# Try loading WAV
print("\nTesting WAV loading...")
try:
    wav_file = 'data/train/Hunting Mind_Aug/cat_call.wav'
    if os.path.exists(wav_file):
        y, sr = librosa.load(wav_file, sr=22050, duration=5)
        print(f"✓ WAV loading works: {len(y)} samples at {sr}Hz")
    else:
        print(f"✗ Test WAV file not found: {wav_file}")
except Exception as e:
    print(f"✗ WAV loading failed: {type(e).__name__}: {e}")

# Try loading MP3 (simulating the issue)
print("\nTesting MP3 loading...")
try:
    import tempfile
    import urllib.request
    
    # Create a test with a small MP3-like file
    mp3_test_path = "test_audio.mp3"
    print(f"  Note: MP3 requires audioread backend")
    print(f"  Librosa will try to use audioread for MP3 decoding")
    
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
