# Meowlytics Android App - Setup Instructions

## Prerequisites
- Android Studio (latest version)
- JDK 11 or higher
- Android SDK API 26+
- Your Vercel backend running at: https://new-meowlytics.vercel.app/

## Step-by-Step Setup

### 1. Create New Android Project
- Open Android Studio
- Click **File → New → New Project**
- Select **Empty Activity**
- Configure:
  - **Name**: MeowlyticsApp
  - **Package name**: com.meowlytics.app
  - **Language**: Java
  - **Minimum API**: 26
  - **Target API**: 34

### 2. Copy Files
After creating the project, copy these files to the appropriate locations:

```
app/src/main/java/com/meowlytics/app/
├── MainActivity.java          → Copy content
├── AudioRecorder.java         → Copy content
└── ApiClient.java             → Copy content

app/src/main/res/values/
├── strings.xml                → Merge/replace
├── colors.xml                 → Merge/replace
└── styles.xml                 → Merge/replace

app/src/main/res/drawable/
├── status_background.xml      → Copy
└── result_background.xml      → Copy

app/src/main/
└── AndroidManifest.xml        → Merge permissions

app/src/main/res/layout/
└── activity_main.xml          → Replace/create

build.gradle (Module: app)     → Update dependencies section
```

### 3. Update Gradle Dependencies
In `build.gradle` (Module: app), update the `dependencies` block with the content from the provided file.

### 4. Create Drawable Resources
Create two new XML files in `app/src/main/res/drawable/`:

**File 1: status_background.xml**
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="@color/surface" />
    <corners android:radius="8dp" />
    <stroke android:width="1dp" android:color="@color/secondary" />
</shape>
```

**File 2: result_background.xml**
```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="@color/surface" />
    <corners android:radius="12dp" />
    <stroke android:width="2dp" android:color="@color/secondary" />
</shape>
```

### 5. Sync and Build
- Click **File → Sync Now**
- Wait for Gradle to sync
- Click **Build → Make Project**
- If there are errors, follow Android Studio's suggestions

### 6. Run the App
- Click **Run → Run 'app'**
- Select an emulator or connected device
- The app should launch on your device

## Features

✅ **Record Audio**: 5-second recording from microphone
✅ **Analyze**: Send audio to your Vercel backend
✅ **Display Results**: Show cat sound classification and confidence percentage
✅ **Error Handling**: Graceful error messages for network/file issues
✅ **Permissions**: Automatically requests microphone and storage permissions

## API Integration

The app communicates with your Vercel backend at:
- **Base URL**: https://new-meowlytics.vercel.app
- **Endpoint**: POST /analyze
- **Request**: Multipart form data with audio file
- **Response**: JSON with classification and confidence

```json
{
  "class": "Angry_Aug",
  "confidence": 95.45,
  "success": true,
  "freq_data": {...}
}
```

## Troubleshooting

### Build Errors
1. File → Invalidate Caches
2. Delete `build/` folder
3. Sync Gradle again

### Runtime Errors
- Check that permissions are granted
- Ensure your device has internet connection
- Verify Vercel backend is accessible

### Recording Not Working
- Ensure microphone permission is granted
- Check device has microphone hardware
- Try restarting the app

### Analysis Fails
- Check network connection
- Verify Vercel URL is correct
- Check backend is running/deployed

## Next Steps

1. **Test on emulator or device**
2. **Debug using Logcat**: View → Tool Windows → Logcat
3. **Make APK**: Build → Build Bundle(s) / APK(s) → Build APK(s)
4. **Share APK** or publish to Google Play Store

## Support

For issues with:
- **Android Development**: Check Android Studio documentation
- **Backend Integration**: Verify your Vercel deployment
- **Audio Recording**: Ensure permissions and microphone access
