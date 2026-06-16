const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Simulate multiple PLC devices with real-time data
const plcDevices = {
  'PLC-001': {
    name: 'PLC Factory Line 1',
    status: 'Online',
    temperature: 65,
    pressure: 120,
    speed: 1500,
    production: 0,
    lastUpdate: new Date(),
    color: '#4CAF50'
  },
  'PLC-002': {
    name: 'PLC Factory Line 2',
    status: 'Online',
    temperature: 72,
    pressure: 125,
    speed: 1200,
    production: 0,
    lastUpdate: new Date(),
    color: '#2196F3'
  },
  'PLC-003': {
    name: 'PLC Warehouse Control',
    status: 'Online',
    temperature: 68,
    pressure: 115,
    speed: 800,
    production: 0,
    lastUpdate: new Date(),
    color: '#FF9800'
  },
  'PLC-004': {
    name: 'PLC Quality Check',
    status: 'Online',
    temperature: 70,
    pressure: 118,
    speed: 900,
    production: 0,
    lastUpdate: new Date(),
    color: '#9C27B0'
  }
};

// Simulate data changes
setInterval(() => {
  Object.keys(plcDevices).forEach(key => {
    const plc = plcDevices[key];
    
    // Random fluctuations
    plc.temperature += (Math.random() - 0.5) * 2;
    plc.temperature = Math.max(50, Math.min(100, plc.temperature));
    
    plc.pressure += (Math.random() - 0.5) * 3;
    plc.pressure = Math.max(100, Math.min(150, plc.pressure));
    
    plc.speed += (Math.random() - 0.5) * 100;
    plc.speed = Math.max(500, Math.min(2000, plc.speed));
    
    plc.production += Math.floor(Math.random() * 5);
    plc.lastUpdate = new Date();
    
    // Occasionally change status
    if (Math.random() > 0.98) {
      plc.status = plc.status === 'Online' ? 'Offline' : 'Online';
    }
  });
}, 1000);

// API endpoint to get all PLC devices
app.get('/api/devices', (req, res) => {
  const devices = Object.entries(plcDevices).map(([id, data]) => ({
    id,
    ...data,
    temperature: parseFloat(data.temperature.toFixed(1)),
    pressure: parseFloat(data.pressure.toFixed(1)),
    speed: Math.round(data.speed),
    lastUpdate: data.lastUpdate.toISOString()
  }));
  res.json(devices);
});

// API endpoint to get single device
app.get('/api/devices/:id', (req, res) => {
  const device = plcDevices[req.params.id];
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  res.json({
    id: req.params.id,
    ...device,
    temperature: parseFloat(device.temperature.toFixed(1)),
    pressure: parseFloat(device.pressure.toFixed(1)),
    speed: Math.round(device.speed),
    lastUpdate: device.lastUpdate.toISOString()
  });
});

// API endpoint to control a device
app.post('/api/devices/:id/control', (req, res) => {
  const device = plcDevices[req.params.id];
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  
  const { command } = req.body;
  
  if (command === 'start') {
    device.status = 'Online';
  } else if (command === 'stop') {
    device.status = 'Offline';
  } else if (command === 'reset') {
    device.production = 0;
  }
  
  res.json({ success: true, status: device.status });
});

app.listen(PORT, () => {
  console.log(`\n🏭 OPCUA PLC Simulator running at http://localhost:${PORT}\n`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/devices\n`);
});
