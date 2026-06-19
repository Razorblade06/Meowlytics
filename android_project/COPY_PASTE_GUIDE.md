# Android Studio Setup - Copy/Paste Guide

## STEP 1: Create New Project in Android Studio

1. **Open Android Studio**
2. **File → New → New Project**
3. Select **Empty Activity**
4. Fill in:
   - **Name**: MeowlyticsApp
   - **Package name**: com.meowlytics.app
   - **Language**: Java
   - **Minimum API level**: 26
5. Click **Finish**

---

## STEP 2: Update build.gradle (Module: app)

**Location**: `app/build.gradle`

1. Open the file
2. Find the `dependencies { }` section
3. **Replace the entire `dependencies` block** with this:

```gradle
dependencies {
    // Android Core
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
    implementation 'androidx.core:core:1.12.0'

    // Material Design
    implementation 'com.google.android.material:material:1.11.0'

    // HTTP Client
    implementation 'com.squareup.okhttp3:okhttp:4.11.0'

    // JSON Parsing
    implementation 'com.google.code.gson:gson:2.10.1'

    // Lifecycle
    implementation 'androidx.lifecycle:lifecycle-runtime:2.6.2'
    implementation 'androidx.lifecycle:lifecycle-livedata:2.6.2'
    implementation 'androidx.lifecycle:lifecycle-viewmodel:2.6.2'

    // Testing
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.1.5'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.5.1'
}
```

4. Click **Sync Now** at the top

---

## STEP 3: Create Java Classes

### 3.1 MainActivity.java

**Location**: `app/src/main/java/com/meowlytics/app/MainActivity.java`

1. Right-click on `com.meowlytics.app` package
2. **New → Java Class**
3. Name: `MainActivity`
4. **Paste this code**:

```java
package com.meowlytics.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.io.File;

public class MainActivity extends AppCompatActivity {

    private static final int PERMISSION_REQUEST_CODE = 100;
    private static final String[] REQUIRED_PERMISSIONS = {
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.WRITE_EXTERNAL_STORAGE,
            Manifest.permission.READ_EXTERNAL_STORAGE
    };

    private Button recordButton;
    private Button analyzeButton;
    private ProgressBar progressBar;
    private TextView resultTextView;
    private TextView confidenceTextView;
    private TextView statusTextView;

    private AudioRecorder audioRecorder;
    private ApiClient apiClient;
    private File recordedFile;
    private boolean isRecording = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize views
        recordButton = findViewById(R.id.recordButton);
        analyzeButton = findViewById(R.id.analyzeButton);
        progressBar = findViewById(R.id.progressBar);
        resultTextView = findViewById(R.id.resultTextView);
        confidenceTextView = findViewById(R.id.confidenceTextView);
        statusTextView = findViewById(R.id.statusTextView);

        // Initialize components
        audioRecorder = new AudioRecorder(this);
        apiClient = new ApiClient("https://new-meowlytics.vercel.app");

        // Request permissions
        requestPermissions();

        // Set up button listeners
        recordButton.setOnClickListener(v -> toggleRecording());
        analyzeButton.setOnClickListener(v -> analyzeRecording());

        updateUIState();
    }

    private void requestPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            boolean allPermissionsGranted = true;
            for (String permission : REQUIRED_PERMISSIONS) {
                if (ContextCompat.checkSelfPermission(this, permission)
                        != PackageManager.PERMISSION_GRANTED) {
                    allPermissionsGranted = false;
                    break;
                }
            }
            if (!allPermissionsGranted) {
                ActivityCompat.requestPermissions(this, REQUIRED_PERMISSIONS, PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions,
                                          @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            if (!allGranted) {
                Toast.makeText(this, "Permissions are required to use this app", Toast.LENGTH_SHORT).show();
            }
        }
    }

    private void toggleRecording() {
        if (!isRecording) {
            recordedFile = audioRecorder.startRecording();
            if (recordedFile != null) {
                isRecording = true;
                statusTextView.setText("Recording... (5 seconds)");
                recordButton.setText("Stop Recording");
                analyzeButton.setEnabled(false);

                // Auto-stop after 5 seconds
                recordButton.postDelayed(() -> {
                    if (isRecording) {
                        stopRecording();
                    }
                }, 5000);
            } else {
                Toast.makeText(this, "Failed to start recording", Toast.LENGTH_SHORT).show();
            }
        } else {
            stopRecording();
        }
    }

    private void stopRecording() {
        if (audioRecorder.stopRecording()) {
            isRecording = false;
            statusTextView.setText("Recording complete. Ready to analyze.");
            recordButton.setText("Record Again");
            analyzeButton.setEnabled(true);
        } else {
            Toast.makeText(this, "Failed to stop recording", Toast.LENGTH_SHORT).show();
        }
    }

    private void analyzeRecording() {
        if (recordedFile == null || !recordedFile.exists()) {
            Toast.makeText(this, "No recording found. Please record first.", Toast.LENGTH_SHORT).show();
            return;
        }

        progressBar.setVisibility(ProgressBar.VISIBLE);
        analyzeButton.setEnabled(false);
        statusTextView.setText("Analyzing audio...");

        new Thread(() -> {
            try {
                ApiClient.AnalysisResult result = apiClient.analyzeAudio(recordedFile);

                runOnUiThread(() -> {
                    progressBar.setVisibility(ProgressBar.GONE);
                    analyzeButton.setEnabled(true);

                    if (result != null && result.success) {
                        resultTextView.setText("Cat Sound: " + result.classification);
                        confidenceTextView.setText(String.format("Confidence: %.2f%%", result.confidence));
                        statusTextView.setText("Analysis complete!");
                    } else {
                        String errorMsg = result != null ? result.error : "Unknown error";
                        statusTextView.setText("Error: " + errorMsg);
                        Toast.makeText(MainActivity.this, "Analysis failed: " + errorMsg,
                                Toast.LENGTH_SHORT).show();
                    }
                });
            } catch (Exception e) {
                runOnUiThread(() -> {
                    progressBar.setVisibility(ProgressBar.GONE);
                    analyzeButton.setEnabled(true);
                    statusTextView.setText("Error: " + e.getMessage());
                    Toast.makeText(MainActivity.this, "Error: " + e.getMessage(),
                            Toast.LENGTH_SHORT).show();
                });
            }
        }).start();
    }

    private void updateUIState() {
        analyzeButton.setEnabled(false);
        resultTextView.setText("");
        confidenceTextView.setText("");
        statusTextView.setText("Ready to record");
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (audioRecorder != null) {
            audioRecorder.cleanup();
        }
    }
}
```

---

### 3.2 AudioRecorder.java

**Location**: `app/src/main/java/com/meowlytics/app/AudioRecorder.java`

1. Right-click on `com.meowlytics.app` package
2. **New → Java Class**
3. Name: `AudioRecorder`
4. **Paste this code**:

```java
package com.meowlytics.app;

import android.content.Context;
import android.media.MediaRecorder;
import android.os.Environment;
import android.util.Log;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AudioRecorder {

    private static final String TAG = "AudioRecorder";
    private MediaRecorder mediaRecorder;
    private File recordingFile;
    private final Context context;
    private boolean isRecording = false;

    public AudioRecorder(Context context) {
        this.context = context;
    }

    public File startRecording() {
        try {
            if (mediaRecorder != null) {
                mediaRecorder.release();
            }

            mediaRecorder = new MediaRecorder();
            mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.THREE_GPP);
            mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);

            // Create file in cache directory
            recordingFile = createAudioFile();
            if (recordingFile == null) {
                Log.e(TAG, "Failed to create audio file");
                return null;
            }

            mediaRecorder.setOutputFile(recordingFile.getAbsolutePath());
            mediaRecorder.prepare();
            mediaRecorder.start();

            isRecording = true;
            Log.d(TAG, "Recording started: " + recordingFile.getAbsolutePath());
            return recordingFile;

        } catch (IOException | RuntimeException e) {
            Log.e(TAG, "Error starting recording", e);
            if (mediaRecorder != null) {
                try {
                    mediaRecorder.release();
                } catch (Exception ex) {
                    Log.e(TAG, "Error releasing media recorder", ex);
                }
                mediaRecorder = null;
            }
            return null;
        }
    }

    public boolean stopRecording() {
        try {
            if (mediaRecorder != null && isRecording) {
                mediaRecorder.stop();
                mediaRecorder.release();
                mediaRecorder = null;
                isRecording = false;
                Log.d(TAG, "Recording stopped");
                return true;
            }
        } catch (RuntimeException e) {
            Log.e(TAG, "Error stopping recording", e);
            if (mediaRecorder != null) {
                try {
                    mediaRecorder.release();
                } catch (Exception ex) {
                    Log.e(TAG, "Error releasing media recorder", ex);
                }
                mediaRecorder = null;
            }
        }
        return false;
    }

    private File createAudioFile() {
        try {
            File cacheDir = context.getCacheDir();
            String timestamp = new SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(new Date());
            String fileName = "cat_audio_" + timestamp + ".3gp";
            return new File(cacheDir, fileName);
        } catch (Exception e) {
            Log.e(TAG, "Error creating audio file", e);
            return null;
        }
    }

    public boolean isRecording() {
        return isRecording;
    }

    public void cleanup() {
        if (mediaRecorder != null) {
            try {
                if (isRecording) {
                    mediaRecorder.stop();
                }
                mediaRecorder.release();
            } catch (Exception e) {
                Log.e(TAG, "Error during cleanup", e);
            }
            mediaRecorder = null;
        }
    }
}
```

---

### 3.3 ApiClient.java

**Location**: `app/src/main/java/com/meowlytics/app/ApiClient.java`

1. Right-click on `com.meowlytics.app` package
2. **New → Java Class**
3. Name: `ApiClient`
4. **Paste this code**:

```java
package com.meowlytics.app;

import android.util.Log;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.io.File;
import java.io.IOException;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class ApiClient {

    private static final String TAG = "ApiClient";
    private final String baseUrl;
    private final OkHttpClient httpClient;
    private final Gson gson;

    public ApiClient(String baseUrl) {
        this.baseUrl = baseUrl;
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                .writeTimeout(30, java.util.concurrent.TimeUnit.SECONDS)
                .build();
        this.gson = new Gson();
    }

    public AnalysisResult analyzeAudio(File audioFile) throws IOException {
        if (!audioFile.exists()) {
            throw new IOException("Audio file does not exist: " + audioFile.getAbsolutePath());
        }

        // Create multipart request body
        RequestBody requestBody = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("file", audioFile.getName(),
                        RequestBody.create(audioFile, MediaType.get("audio/3gpp")))
                .build();

        Request request = new Request.Builder()
                .url(baseUrl + "/analyze")
                .post(requestBody)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            String responseBody = response.body().string();
            Log.d(TAG, "Response: " + responseBody);

            if (!response.isSuccessful()) {
                return new AnalysisResult(false, "HTTP " + response.code(), null, 0);
            }

            // Parse JSON response
            JsonObject jsonObject = gson.fromJson(responseBody, JsonObject.class);
            boolean success = jsonObject.get("success").getAsBoolean();

            if (!success) {
                String error = jsonObject.has("error") ? jsonObject.get("error").getAsString() : "Unknown error";
                return new AnalysisResult(false, error, null, 0);
            }

            String classification = jsonObject.get("class").getAsString();
            double confidence = jsonObject.get("confidence").getAsDouble();

            return new AnalysisResult(true, null, classification, confidence);

        } catch (Exception e) {
            Log.e(TAG, "Error analyzing audio", e);
            throw new IOException("Error communicating with server: " + e.getMessage(), e);
        }
    }

    // Result class
    public static class AnalysisResult {
        public boolean success;
        public String error;
        public String classification;
        public double confidence;

        public AnalysisResult(boolean success, String error, String classification, double confidence) {
            this.success = success;
            this.error = error;
            this.classification = classification;
            this.confidence = confidence;
        }
    }
}
```

---

## STEP 4: Update AndroidManifest.xml

**Location**: `app/src/main/AndroidManifest.xml`

1. Open the file
2. **Replace the entire file** with this:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:supportsRtl="true"
        android:theme="@style/Theme.MeowlyticsApp"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

    </application>

</manifest>
```

---

## STEP 5: Create Layout File

**Location**: `app/src/main/res/layout/activity_main.xml`

1. Right-click on `res/layout` folder
2. **New → Layout Resource File**
3. Name: `activity_main`
4. **Replace the entire file** with this:

```xml
<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:padding="24dp"
    android:gravity="center">

    <!-- Header -->
    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Meowlytics"
        android:textSize="32sp"
        android:textStyle="bold"
        android:textColor="@color/primary"
        android:layout_marginBottom="8dp" />

    <TextView
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Cat Sound Classifier"
        android:textSize="16sp"
        android:textColor="@color/text_secondary"
        android:layout_marginBottom="32dp" />

    <!-- Status View -->
    <TextView
        android:id="@+id/statusTextView"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="Ready to record"
        android:textSize="14sp"
        android:textColor="@color/text_secondary"
        android:textAlignment="center"
        android:layout_marginBottom="24dp"
        android:padding="12dp"
        android:background="@drawable/status_background"
        android:elevation="2dp" />

    <!-- Record Button -->
    <Button
        android:id="@+id/recordButton"
        android:layout_width="match_parent"
        android:layout_height="56dp"
        android:text="Record Audio"
        android:textSize="16sp"
        android:backgroundTint="@color/primary"
        android:layout_marginBottom="16dp" />

    <!-- Analyze Button -->
    <Button
        android:id="@+id/analyzeButton"
        android:layout_width="match_parent"
        android:layout_height="56dp"
        android:text="Analyze"
        android:textSize="16sp"
        android:backgroundTint="@color/secondary"
        android:layout_marginBottom="32dp" />

    <!-- Progress Bar -->
    <ProgressBar
        android:id="@+id/progressBar"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:visibility="gone"
        android:layout_marginBottom="24dp" />

    <!-- Results Section -->
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:orientation="vertical"
        android:padding="16dp"
        android:background="@drawable/result_background"
        android:layout_marginBottom="16dp">

        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="Classification Result"
            android:textSize="14sp"
            android:textColor="@color/text_secondary"
            android:layout_marginBottom="8dp" />

        <TextView
            android:id="@+id/resultTextView"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="No result yet"
            android:textSize="20sp"
            android:textStyle="bold"
            android:textColor="@color/primary"
            android:layout_marginBottom="16dp" />

        <TextView
            android:id="@+id/confidenceTextView"
            android:layout_width="match_parent"
            android:layout_height="wrap_content"
            android:text="Confidence: --"
            android:textSize="16sp"
            android:textColor="@color/text_primary" />

    </LinearLayout>

</LinearLayout>
```

---

## STEP 6: Create Resource Files

### 6.1 colors.xml

**Location**: `app/src/main/res/values/colors.xml`

1. Right-click on `res/values` folder
2. **New → Values Resource File**
3. Name: `colors`
4. **Replace with**:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="primary">#FF6B6B</color>
    <color name="primary_dark">#E63946</color>
    <color name="secondary">#4ECDC4</color>
    <color name="secondary_dark">#45B7B0</color>
    <color name="background">#FFFFFF</color>
    <color name="surface">#F5F5F5</color>
    <color name="text_primary">#1A1A1A</color>
    <color name="text_secondary">#666666</color>
    <color name="error">#E63946</color>
</resources>
```

---

### 6.2 strings.xml

**Location**: `app/src/main/res/values/strings.xml`

1. Find existing `strings.xml` file
2. **Replace with**:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Meowlytics</string>
    <string name="record_button_text">Record Audio</string>
    <string name="analyze_button_text">Analyze</string>
    <string name="status_ready">Ready to record</string>
    <string name="status_recording">Recording... (5 seconds)</string>
    <string name="status_complete">Recording complete. Ready to analyze.</string>
    <string name="status_analyzing">Analyzing audio...</string>
    <string name="error_no_recording">No recording found. Please record first.</string>
    <string name="error_failed_to_record">Failed to start recording</string>
    <string name="error_permissions_required">Permissions are required to use this app</string>
</resources>
```

---

### 6.3 styles.xml

**Location**: `app/src/main/res/values/styles.xml`

1. Find or create `styles.xml`
2. **Replace with**:

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.MeowlyticsApp" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/primary</item>
        <item name="colorPrimaryDark">@color/primary_dark</item>
        <item name="colorAccent">@color/secondary</item>
        <item name="android:windowBackground">@color/background</item>
    </style>
</resources>
```

---

## STEP 7: Create Drawable Files

### 7.1 status_background.xml

**Location**: `app/src/main/res/drawable/status_background.xml`

1. Right-click on `res/drawable` folder
2. **New → Drawable Resource File**
3. Name: `status_background`
4. **Replace with**:

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="@color/surface" />
    <corners android:radius="8dp" />
    <stroke android:width="1dp" android:color="@color/secondary" />
</shape>
```

---

### 7.2 result_background.xml

**Location**: `app/src/main/res/drawable/result_background.xml`

1. Right-click on `res/drawable` folder
2. **New → Drawable Resource File**
3. Name: `result_background`
4. **Replace with**:

```xml
<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android">
    <solid android:color="@color/surface" />
    <corners android:radius="12dp" />
    <stroke android:width="2dp" android:color="@color/secondary" />
</shape>
```

---

## STEP 8: Final Steps

1. **File → Sync Now** (or you'll see prompt at top)
2. **Build → Clean Project**
3. **Build → Rebuild Project**
4. **Run → Run 'app'** (or press Shift+F10)
5. Select emulator or device

---

## ✅ You're Done!

Your Meowlytics app is ready! The app will:
- ✅ Record 5-second audio clips
- ✅ Send to your Vercel backend
- ✅ Display cat sound classification
- ✅ Show confidence percentage

Enjoy! 🐱
