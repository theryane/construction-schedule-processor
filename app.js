// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const status = document.getElementById('status');
const preview = document.getElementById('preview');
const downloadBtn = document.getElementById('downloadBtn');

// Event Listeners
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('dragleave', handleDragLeave);
dropZone.addEventListener('drop', handleDrop);
fileInput.addEventListener('change', handleFileSelect);
downloadBtn.addEventListener('click', handleDownload);

function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
        processFile(file);
    } else {
        showStatus('Please upload a PDF file.', 'error');
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) processFile(file);
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = type;
}

async function processFile(file) {
    try {
        showStatus('Processing PDF...', 'success');
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const data = await extractData(pdf);
        displayData(data);
        downloadBtn.style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
        showStatus('Error processing PDF', 'error');
    }
}

async function extractData(pdf) {
    const data = [];
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const processedContent = processPageContent(content.items);
        data.push(...processedContent);
    }
    return data;
}

function processPageContent(items) {
    return pdfProcessor.processItems(items);
}

function displayData(data) {
    preview.innerHTML = '';
    preview.style.display = 'block';

    const header = "Activity ID,Activity Name,Original Duration,Remaining Duration,Start Date,Finish Date\n\n";
    let content = header;

    data.forEach(row => {
        content += `${row.activityId},${row.activityName},${row.originalDuration},${row.remainingDuration},${row.startDate},${row.finishDate}\n\n`;
    });

    preview.textContent = content;
}

function handleDownload() {
    const blob = new Blob([preview.textContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schedule.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
