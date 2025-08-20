document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.querySelector('.drop-zone');
    const fileInput = dropZone.querySelector('.drop-zone__input');
    const form = document.getElementById('uploadForm');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    const clearButton = document.getElementById('clearButton');

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
});
