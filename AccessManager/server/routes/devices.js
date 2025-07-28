const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { executeNetworkCommand } = require('../utils/networkControl');

// Get user devices
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const devicesResult = await pool.query(
      'SELECT * FROM devices WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    res.json(devicesResult.rows);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Add device
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, mac_address } = req.body;
    
    // Validate input
    if (!name || !mac_address) {
      return res.status(400).json({ message: 'Nom et adresse MAC requis' });
    }
    
    // Validate MAC address format
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(mac_address)) {
      return res.status(400).json({ message: 'Format d\'adresse MAC invalide' });
    }
    
    // Check device limit
    const settingResult = await pool.query(
      'SELECT value FROM settings WHERE key = $1',
      ['max_devices_per_user']
    );
    
    const maxDevices = parseInt(settingResult.rows[0]?.value || '4');
    
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM devices WHERE user_id = $1',
      [userId]
    );
    
    if (parseInt(countResult.rows[0].count) >= maxDevices) {
      return res.status(400).json({ 
        message: `Limite de ${maxDevices} appareils atteinte. Veuillez supprimer un appareil existant.` 
      });
    }
    
    // Check if device already exists
    const existingDevice = await pool.query(
      'SELECT * FROM devices WHERE mac_address = $1',
      [mac_address]
    );
    
    if (existingDevice.rows.length > 0) {
      return res.status(400).json({ message: 'Cet appareil est déjà enregistré' });
    }
    
    // Add device
    const result = await pool.query(
      'INSERT INTO devices (user_id, name, mac_address) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, mac_address]
    );
    
    // Allow network access for this device
    await executeNetworkCommand('allow', mac_address);
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding device:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Remove device
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const deviceId = req.params.id;
    
    // Get device info for network rules
    const deviceResult = await pool.query(
      'SELECT mac_address FROM devices WHERE id = $1 AND user_id = $2',
      [deviceId, userId]
    );
    
    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Appareil non trouvé' });
    }
    
    const mac_address = deviceResult.rows[0].mac_address;
    
    // Delete device
    await pool.query(
      'DELETE FROM devices WHERE id = $1 AND user_id = $2',
      [deviceId, userId]
    );
    
    // Block network access for this device
    await executeNetworkCommand('block', mac_address);
    
    res.json({ message: 'Appareil supprimé avec succès' });
  } catch (error) {
    console.error('Error removing device:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Connect/Disconnect device
router.put('/:id/status', async (req, res) => {
  try {
    const userId = req.user.id;
    const deviceId = req.params.id;
    const { connect } = req.body; // true to connect, false to disconnect
    
    // Get device info
    const deviceResult = await pool.query(
      'SELECT * FROM devices WHERE id = $1 AND user_id = $2',
      [deviceId, userId]
    );
    
    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Appareil non trouvé' });
    }
    
    const device = deviceResult.rows[0];
    
    if (connect) {
      // Check if device is blocked
      if (device.blocked) {
        return res.status(403).json({ message: 'Cet appareil est bloqué' });
      }
      
      // Connect device
      await pool.query(
        'UPDATE devices SET is_connected = true, last_connected = NOW() WHERE id = $1',
        [deviceId]
      );
      
      // Log connection
      await pool.query(
        'INSERT INTO connection_logs (user_id, device_id, connected_at) VALUES ($1, $2, NOW())',
        [userId, deviceId]
      );
      
      // Allow network access
      await executeNetworkCommand('allow', device.mac_address);
      
      res.json({ message: 'Appareil connecté' });
    } else {
      // Disconnect device
      await pool.query(
        'UPDATE devices SET is_connected = false WHERE id = $1',
        [deviceId]
      );
      
      // Update connection log
      await pool.query(
        `UPDATE connection_logs 
         SET disconnected_at = NOW(), 
             duration = EXTRACT(EPOCH FROM (NOW() - connected_at))
         WHERE device_id = $1 AND disconnected_at IS NULL`,
        [deviceId]
      );
      
      // Block network access
      await executeNetworkCommand('block', device.mac_address);
      
      res.json({ message: 'Appareil déconnecté' });
    }
  } catch (error) {
    console.error('Error updating device status:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;