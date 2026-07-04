const form = document.getElementById('extractForm');
const urlInput = document.getElementById('urlInput');
const submitBtn = document.getElementById('submitBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const url = urlInput.value.trim();
    
    if (!url) {
        showError('Please enter a URL');
        return;
    }
    
    // Show loading
    loading.classList.remove('hidden');
    result.classList.add('hidden');
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess(data.data);
        } else {
            showError(data.message || 'Failed to extract coordinates');
        }
    } catch (error) {
        showError('Network error. Please try again.');
    } finally {
        loading.classList.add('hidden');
        submitBtn.disabled = false;
    }
});

function showSuccess(data) {
    result.className = 'result success';
    result.innerHTML = `
        <h3>✅ Coordinates Extracted Successfully!</h3>
        <div class="coord-grid">
            <div class="coord-item">
                <label>Latitude</label>
                <div class="value">${data.latitude}</div>
            </div>
            <div class="coord-item">
                <label>Longitude</label>
                <div class="value">${data.longitude}</div>
            </div>
        </div>
        <div class="source-info">
            <strong>Source:</strong> ${formatSource(data.source)}
        </div>
    `;
    result.classList.remove('hidden');
}

function showError(message) {
    result.className = 'result error';
    result.innerHTML = `
        <h3>❌ Error</h3>
        <p>${message}</p>
    `;
    result.classList.remove('hidden');
}

function formatSource(source) {
    const sources = {
        'direct_extraction': 'Extracted directly from URL (no API call)',
        'place_details_api': 'Google Places API (Place Details)',
        'geocoding_api': 'Google Geocoding API',
        'place_search_api': 'Google Places API (Search)',
    };
    return sources[source] || source;
}

// Test URL function
function testUrl(url) {
    urlInput.value = url;
    form.dispatchEvent(new Event('submit'));
}
