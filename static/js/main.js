document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const results = document.getElementById('results');
    const loading = document.getElementById('loading');
    const classification = document.getElementById('classification');
    const confidenceScore = document.getElementById('confidenceScore');

    // Handle drag and drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Handle file selection
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('audio/')) {
                fileName.textContent = file.name;
                fileInfo.style.display = 'block';
                results.style.display = 'none';
            } else {
                alert('Please upload an audio file.');
            }
        }
    }

    // Handle analysis
    analyzeBtn.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        loading.style.display = 'block';
        fileInfo.style.display = 'none';
        results.style.display = 'none';

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                classification.textContent = data.class;
                confidenceScore.textContent = `${Math.round(data.confidence * 100)}% Confidence`;
                results.style.display = 'block';
            } else {
                alert(data.error || 'An error occurred during analysis');
            }
        } catch (error) {
            alert('An error occurred while connecting to the server');
        } finally {
            loading.style.display = 'none';
            fileInfo.style.display = 'block';
        }
    });
});
