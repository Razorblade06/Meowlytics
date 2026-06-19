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
