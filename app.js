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

// Drag and Drop Handlers
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
    if (file) {
        processFile(file);
    }
}

// Status Display
function showStatus(message, type) {
    status.textContent = message;
    status.className = type;
    status.style.display = 'block';
}

// Main PDF Processing
async function processFile(file) {
    try {
        showStatus('Reading PDF file...', 'success');
        
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        showStatus('Processing PDF content...', 'success');
        
        // Process all pages
        const textContent = [];
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            textContent.push(...content.items.map(item => item.str));
        }

        // Parse the content
        const parsedData = parseScheduleData(textContent);
        
        // Display preview
        showPreview(parsedData);
        
        // Enable download
        downloadBtn.style.display = 'block';
        
        showStatus('PDF processed successfully!', 'success');
    } catch (error) {
        console.error('Error processing PDF:', error);
        showStatus('Error processing PDF. Please try again.', 'error');
    }
}

// Parse Schedule Data
function parseScheduleData(textContent) {
    // Join all text content
    const text = textContent.join(' ');
    
    // Initialize data structure
    const scheduleData = {
        activities: [],
        headers: ['Activity ID', 'Activity Name', 'Original Duration', 'Remaining Duration', 'Start', 'Finish']
    };

    // Split into lines and process
    const lines = text.split(/\\n/);
    let currentActivity = {};
    
    for (const line of lines) {
        // Look for activity patterns
        if (line.match(/^[A-Z0-9-]+\s/)) {
            if (Object.keys(currentActivity).length > 0) {
                scheduleData.activities.push(currentActivity);
            }
            currentActivity = parseLine(line);
        }
    }

    return scheduleData;
}

// Parse individual line
function parseLine(line) {
    const parts = line.trim().split(/\s+/);
    return {
        activityId: parts[0],
        activityName: parts.slice(1, -4).join(' '),
        originalDuration: parts[parts.length - 4],
        remainingDuration: parts[parts.length - 3],
        start: parts[parts.length - 2],
        finish: parts[parts.length - 1]
    };
}

// Preview Data
function showPreview(data) {
    preview.style.display = 'block';
    
    // Create preview table
    const table = document.createElement('table');
    
    // Add headers
    const headerRow = document.createElement('tr');
    data.headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Add data rows
    data.activities.forEach(activity => {
        const row = document.createElement('tr');
        Object.values(activity).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);
        });
        table.appendChild(row);
    });
    
    preview.innerHTML = '';
    preview.appendChild(table);
}

// Handle Download
function handleDownload() {
    // Convert data to CSV
    const previewTable = preview.querySelector('table');
    const rows = Array.from(previewTable.querySelectorAll('tr'));
    
    const csvContent = rows.map(row => {
        return Array.from(row.cells)
            .map(cell => `"${cell.textContent}"`)
            .join(',');
    }).join('\\n');
    
    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'schedule_data.csv';
    
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}
