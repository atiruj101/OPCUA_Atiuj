// Auto-refresh with debounce and error handling
let autoRefreshInterval;
let isLoading = false;
let lastRefreshTime = 0;
const REFRESH_DELAY = 10000; // 10 seconds between refreshes

function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('th-TH');
}

function updateClock() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeString = `${hours}:${minutes}:${seconds}`;
    
    const clockElement = document.getElementById('currentTime');
    if (clockElement) {
        clockElement.textContent = timeString;
    }
}

async function loadDevices() {
    // Prevent multiple simultaneous requests
    if (isLoading) return;
    
    // Debounce: don't refresh too frequently
    const now = Date.now();
    if (now - lastRefreshTime < REFRESH_DELAY) return;
    
    isLoading = true;
    lastRefreshTime = now;
    
    try {
        const response = await fetch('/api/devices');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const devices = await response.json();
        
        // Update total production
        const totalProduction = devices.reduce((sum, device) => sum + device.production, 0);
        document.getElementById('totalProduction').textContent = totalProduction;
        document.getElementById('lastUpdate').textContent = formatTime(new Date());
        
        // Render devices
        const container = document.getElementById('devicesContainer');
        container.innerHTML = '';
        
        devices.forEach(device => {
            const card = createDeviceCard(device);
            container.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading devices:', error);
    } finally {
        isLoading = false;
    }
}

function createDeviceCard(device) {
    const card = document.createElement('div');
    card.className = 'device-card';
    card.style.borderLeftColor = device.color;
    
    // Calculate progress percentage for speed
    const speedPercent = (device.speed / 2000) * 100;
    const tempPercent = ((device.temperature - 50) / 50) * 100;
    const pressurePercent = ((device.pressure - 100) / 50) * 100;
    
    const statusClass = device.status === 'Online' ? 'status-online' : 'status-offline';
    
    card.innerHTML = `
        <div class="device-header">
            <div>
                <div class="device-name">${device.name}</div>
                <div class="device-id">${device.id}</div>
            </div>
            <span class="status-badge ${statusClass}">${device.status}</span>
        </div>
        
        <div class="device-data">
            <div class="data-item">
                <div class="data-label">🌡️ Temperature</div>
                <div class="data-value">
                    ${device.temperature.toFixed(1)}<span class="data-unit">°C</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${tempPercent}%"></div>
                </div>
            </div>
            
            <div class="data-item">
                <div class="data-label">⚙️ Pressure</div>
                <div class="data-value">
                    ${device.pressure.toFixed(1)}<span class="data-unit">bar</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${pressurePercent}%"></div>
                </div>
            </div>
            
            <div class="data-item">
                <div class="data-label">⚡ Speed</div>
                <div class="data-value">
                    ${device.speed}<span class="data-unit">rpm</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${speedPercent}%"></div>
                </div>
            </div>
            
            <div class="data-item">
                <div class="data-label">📦 Production Count</div>
                <div class="data-value">${device.production}</div>
            </div>
        </div>
        
        <div class="device-actions">
            <button class="btn btn-primary" onclick="controlDevice('${device.id}', 'start')">▶️ Start</button>
            <button class="btn btn-danger" onclick="controlDevice('${device.id}', 'stop')">⏹️ Stop</button>
            <button class="btn btn-secondary" onclick="controlDevice('${device.id}', 'reset')">🔄 Reset</button>
        </div>
        
        <div class="last-update">Updated: ${formatTime(device.lastUpdate)}</div>
    `;
    
    return card;
}

async function controlDevice(deviceId, command) {
    try {
        const response = await fetch(`/api/devices/${deviceId}/control`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ command })
        });
        
        const result = await response.json();
        if (result.success) {
            loadDevices(); // Reload to show changes
            showNotification(`${command.toUpperCase()} command sent to ${deviceId}`);
        }
    } catch (error) {
        console.error('Error controlling device:', error);
        showNotification('Failed to send command', 'error');
    }
}

function showNotification(message, type = 'success') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Could add visual notification here
}

function refreshData() {
    loadDevices();
}

// Initialize and start auto-refresh
document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    loadDevices();
    updateClock();
    
    // Update clock every second
    setInterval(updateClock, 1000);
    
    // Set up auto-refresh (check every 10 seconds)
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    autoRefreshInterval = setInterval(loadDevices, 10000);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
});
