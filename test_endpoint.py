import requests
import os

# Test the /analyze endpoint with an MP3 file
mp3_file = r"data/train/Angry_Aug/car_extcoll0103_aug1(1).mp3"

if os.path.exists(mp3_file):
    print("Testing /analyze endpoint with MP3 file...")
    print("=" * 60)
    
    with open(mp3_file, 'rb') as f:
        files = {'file': f}
        response = requests.post('http://127.0.0.1:5000/analyze', files=files)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")
    print("=" * 60)
else:
    print(f"File not found: {mp3_file}")
