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
