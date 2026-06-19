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
