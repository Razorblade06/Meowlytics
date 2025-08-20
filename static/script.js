document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.querySelector('.drop-zone');
    const fileInput = dropZone.querySelector('.drop-zone__input');
    const form = document.getElementById('uploadForm');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    const clearButton = document.getElementById('clearButton');
    const recordButton = document.getElementById('recordButton');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingTime = document.getElementById('recordingTime');
    const progressBar = recordingStatus.querySelector('.progress-bar');

    let mediaRecorder;
    let audioChunks = [];
    let recordingTimer;
    let recordingDuration = 0;

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    
    // Handle click upload
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Handle form submission
    form.addEventListener('submit', handleSubmit);

    // Handle clear button
    clearButton.addEventListener('click', function(e) {
        e.stopPropagation();
        clearFile();
    });

    // Handle record button
    recordButton.addEventListener('click', toggleRecording);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropZone.classList.add('drag-over');
    }

    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        fileInput.files = files;
        updateDropZoneText(files[0]);
    }

    function handleFileSelect(e) {
        updateDropZoneText(e.target.files[0]);
    }

    function updateDropZoneText(file) {
        const prompt = dropZone.querySelector('.drop-zone__prompt');
        if (file) {
            prompt.textContent = file.name;
            clearButton.style.display = 'flex';
        } else {
            prompt.textContent = 'Drop file here or click to upload';
            clearButton.style.display = 'none';
        }
    }

    function clearFile() {
        fileInput.value = '';
        updateDropZoneText(null);
        clearButton.style.display = 'none';
        result.classList.add('d-none');
        error.classList.add('d-none');
    }

    async function handleSubmit(e) {
        e.preventDefault();
        
        if (!fileInput.files.length) {
            showError('Please select a file first');
            return;
        }

        const formData = new FormData();
        formData.append('file', fileInput.files[0]);

        loading.classList.remove('d-none');
        result.classList.add('d-none');
        error.classList.add('d-none');

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                showResult(data);
            } else {
                showError(data.error);
            }
        } catch (err) {
            showError('An error occurred while analyzing the audio');
        } finally {
            loading.classList.add('d-none');
        }
    }

    function showResult(data) {
        result.classList.remove('d-none');
        result.querySelector('.result-text').textContent = 
            `Your cat is likely expressing: ${data.class}`;
        result.querySelector('.confidence-text').textContent = 
            `Confidence: ${data.confidence}%`;
    }

    function showError(message) {
        error.classList.remove('d-none');
        error.querySelector('.error-text').textContent = message;
    }

    async function toggleRecording() {
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                startRecording();
            } catch (err) {
                showError('Microphone access denied or not available');
            }
        } else {
            stopRecording();
        }
    }

    async function startRecording() {
        audioChunks = [];
        recordingDuration = 0;
        recordButton.classList.add('recording');
        recordButton.innerHTML = '<i class="fas fa-stop"></i> Stop';
        recordingStatus.classList.remove('d-none');

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            try {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                // Create an audio context
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Convert blob to array buffer
                const arrayBuffer = await audioBlob.arrayBuffer();
                // Decode the audio data
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                
                // Create new buffer with correct sample rate (22050Hz)
                const offlineContext = new OfflineAudioContext({
                    numberOfChannels: 1,
                    length: Math.ceil(audioBuffer.duration * 22050),
                    sampleRate: 22050
                });

                const source = offlineContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(offlineContext.destination);
                source.start();

                // Render the audio
                const renderedBuffer = await offlineContext.startRendering();
                
                // Convert to WAV
                const wavBlob = await convertToWav(renderedBuffer);
                const file = new File([wavBlob], 'recording.wav', { type: 'audio/wav' });
                updateDropZoneWithRecording(file);
            } catch (error) {
                console.error('Error processing audio:', error);
                showError('Error processing audio. Please try again.');
            }
        };

        mediaRecorder.start(100); // Collect data every 100ms
        startRecordingTimer();

        // Auto-stop after 5 seconds
        setTimeout(() => {
            if (mediaRecorder && mediaRecorder.state === 'recording') {
                stopRecording();
            }
        }, 5000);
    }

    function stopRecording() {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        recordButton.classList.remove('recording');
        recordButton.innerHTML = '<i class="fas fa-microphone"></i> Record';
        recordingStatus.classList.add('d-none');
        clearInterval(recordingTimer);
        progressBar.style.width = '0%';
    }

    function startRecordingTimer() {
        recordingTimer = setInterval(() => {
            recordingDuration += 0.1;
            recordingTime.textContent = recordingDuration.toFixed(1);
            const progress = (recordingDuration / 5) * 100;
            progressBar.style.width = `${progress}%`;
            
            if (recordingDuration >= 5) {
                stopRecording();
            }
        }, 100);
    }

    function convertToWav(audioBuffer) {
        const numberOfChannels = 1;
        const sampleRate = 22050;
        const format = 1; // PCM
        const bitDepth = 16;
        
        const length = audioBuffer.length * numberOfChannels * (bitDepth / 8);
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);
        
        // Write WAV header
        writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(view, 8, 'WAVE');
        writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numberOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numberOfChannels * (bitDepth / 8), true);
        view.setUint16(32, numberOfChannels * (bitDepth / 8), true);
        view.setUint16(34, bitDepth, true);
        writeString(view, 36, 'data');
        view.setUint32(40, length, true);

        // Write audio data
        const channelData = audioBuffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < channelData.length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function updateDropZoneWithRecording(file) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileInput.files = dt.files;
        updateDropZoneText(file);
    }
});
