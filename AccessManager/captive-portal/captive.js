const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

const app = express();
const PORT = process.env.CAPTIVE_PORT || 3333;
const API_URL = process.env.API_URL || 'http://localhost:5000/api';

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware to capture client MAC and IP
app.use((req, res, next) => {
  // Get client IP
  const clientIp = req.ip || 
                   req.connection.remoteAddress || 
                   req.headers['x-forwarded-for'];
  
  // For MAC address, we'll use ARP on Linux systems
  exec(`arp -a ${clientIp.replace('::ffff:', '')}`, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error('Error getting MAC address:', error || stderr);
      req.clientMac = 'unknown';
    } else {
      // Extract MAC from arp output (format varies by OS)
      const macMatch = stdout.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
      req.clientMac = macMatch ? macMatch[0] : 'unknown';
    }
    
    req.clientIp = clientIp;
    next();
  });
});

// Serve login page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication endpoint
app.post('/auth', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Authenticate with main API
    const authResponse = await axios.post(`${API_URL}/auth/login`, {
      username,
      password
    });
    
    if (authResponse.status === 200 && authResponse.data.token) {
      const userId = authResponse.data.user.id;
      const token = authResponse.data.token;
      
      // Register this device if needed
      try {
        if (req.clientMac !== 'unknown') {
          // Check if device exists
          const deviceResponse = await axios.get(`${API_URL}/devices`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const existingDevice = deviceResponse.data.find(
            d => d.mac_address.toLowerCase() === req.clientMac.toLowerCase()
          );
          
          if (!existingDevice) {
            // Add device
            await axios.post(`${API_URL}/devices`, 
              {
                name: `Appareil automatique (${req.clientIp})`,
                mac_address: req.clientMac,
                ip_address: req.clientIp
              },
              {
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
          } else if (!existingDevice.is_connected) {
            // Connect device
            await axios.put(`${API_URL}/devices/${existingDevice.id}/status`,
              { connect: true },
              { 
                headers: { 'Authorization': `Bearer ${token}` }
              }
            );
          }
        }
        
        // Redirect to success page
        res.redirect('/success.html');
      } catch (deviceError) {
        console.error('Error managing device:', deviceError);
        if (deviceError.response && deviceError.response.status === 400) {
          // Likely device limit reached
          res.redirect('/device-limit.html');
        } else {
          res.redirect('/error.html');
        }
      }
    } else {
      res.redirect('/login-failed.html');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.redirect('/login-failed.html');
  }
});

app.listen(PORT, () => {
  console.log(`Captive portal running on port ${PORT}`);
});