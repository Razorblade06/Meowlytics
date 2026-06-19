import librosa
import os
import traceback

print("=" * 60)
print("Testing MP3 Loading with Librosa")
print("=" * 60)

mp3_file = r"data/train/Angry_Aug/car_extcoll0103_aug1(1).mp3"

if os.path.exists(mp3_file):
    print(f"Found MP3 file: {mp3_file}")
    print(f"File size: {os.path.getsize(mp3_file)} bytes\n")
    
    try:
        print("Attempting to load MP3 with librosa...")
        y, sr = librosa.load(mp3_file, sr=22050, duration=5)
        print(f"✓ SUCCESS: Loaded {len(y)} samples at {sr}Hz")
    except Exception as e:
        print(f"✗ FAILED: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        print("\nFull traceback:")
        traceback.print_exc()
else:
    print(f"✗ MP3 file not found: {mp3_file}")

print("\n" + "=" * 60)
