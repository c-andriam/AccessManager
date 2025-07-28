const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const { executeNetworkCommand } = require('../utils/networkControl');

// Get all users
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, role, active, created_at, last_login FROM users ORDER BY created_at DESC'
    );
    
    // Add device count for each user
    const usersWithDevices = await Promise.all(
      result.rows.map(async (user) => {
        const devicesResult = await pool.query(
          'SELECT COUNT(*) FROM devices WHERE user_id = $1',
          [user.id]
        );
        
        const activeDevicesResult = await pool.query(
          'SELECT COUNT(*) FROM devices WHERE user_id = $1 AND is_connected = true',
          [user.id]
        );
        
        return {
          ...user,
          device_count: parseInt(devicesResult.rows[0].count),
          active_devices: parseInt(activeDevicesResult.rows[0].count)
        };
      })
    );
    
    res.json(usersWithDevices);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Create user
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, role = 'user' } = req.body;
    
    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    // Check if user exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2', 
      [username, email]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Nom d\'utilisateur ou email déjà utilisé' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, role]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Update user
router.put('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, role, active } = req.body;
    
    // Build update query dynamically based on provided fields
    let updateFields = [];
    let queryParams = [];
    let paramCounter = 1;
    
    if (username) {
      updateFields.push(`username = $${paramCounter++}`);
      queryParams.push(username);
    }
    
    if (email) {
      updateFields.push(`email = $${paramCounter++}`);
      queryParams.push(email);
    }
    
    if (role) {
      updateFields.push(`role = $${paramCounter++}`);
      queryParams.push(role);
    }
    
    if (active !== undefined) {
      updateFields.push(`active = $${paramCounter++}`);
      queryParams.push(active);
      
      // If deactivating user, disconnect all devices
      if (active === false) {
        const devicesResult = await pool.query(
          'SELECT mac_address FROM devices WHERE user_id = $1',
          [userId]
        );
        
        for (const device of devicesResult.rows) {
          await executeNetworkCommand('block', device.mac_address);
        }
        
        await pool.query(
          'UPDATE devices SET is_connected = false WHERE user_id = $1',
          [userId]
        );
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
    }
    
    // Add user ID to params
    queryParams.push(userId);
    
    const result = await pool.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCounter} RETURNING id, username, email, role, active`,
      queryParams
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Reset password
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const userId = req.params.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Mot de passe requis' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id',
      [hashedPassword, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get all devices
router.get('/devices', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT d.*, u.username, u.email 
       FROM devices d
       JOIN users u ON d.user_id = u.id
       ORDER BY d.last_connected DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Block/Unblock device
router.put('/devices/:id/block', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { blocked } = req.body;
    
    if (blocked === undefined) {
      return res.status(400).json({ message: 'État de blocage requis' });
    }
    
    // Get device info
    const deviceResult = await pool.query(
      'SELECT * FROM devices WHERE id = $1',
      [deviceId]
    );
    
    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Appareil non trouvé' });
    }
    
    const device = deviceResult.rows[0];
    
    // Update device
    await pool.query(
      'UPDATE devices SET blocked = $1, is_connected = $2 WHERE id = $3',
      [blocked, blocked ? false : device.is_connected, deviceId]
    );
    
    // Apply network rule
    if (blocked) {
      await executeNetworkCommand('block', device.mac_address);
    } else {
      // Only allow if device was connected
      if (device.is_connected) {
        await executeNetworkCommand('allow', device.mac_address);
      }
    }
    
    res.json({ 
      message: blocked ? 'Appareil bloqué' : 'Appareil débloqué' 
    });
  } catch (error) {
    console.error('Error blocking device:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {};
    
    // Total users
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users WHERE role = \'user\'');
    stats.total_users = parseInt(totalUsersResult.rows[0].count);
    
    // Active users (logged in last 24h)
    const activeUsersResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE last_login > NOW() - INTERVAL \'24 hours\''
    );
    stats.active_users_24h = parseInt(activeUsersResult.rows[0].count);
    
    // Total devices
    const totalDevicesResult = await pool.query('SELECT COUNT(*) FROM devices');
    stats.total_devices = parseInt(totalDevicesResult.rows[0].count);
    
    // Connected devices
    const connectedDevicesResult = await pool.query('SELECT COUNT(*) FROM devices WHERE is_connected = true');
    stats.connected_devices = parseInt(connectedDevicesResult.rows[0].count);
    
    // Blocked devices
    const blockedDevicesResult = await pool.query('SELECT COUNT(*) FROM devices WHERE blocked = true');
    stats.blocked_devices = parseInt(blockedDevicesResult.rows[0].count);
    
    // Connections per day (last 7 days)
    const dailyConnectionsResult = await pool.query(
      `SELECT 
        DATE(connected_at) as date, 
        COUNT(*) as count
       FROM connection_logs
       WHERE connected_at > NOW() - INTERVAL '7 days'
       GROUP BY DATE(connected_at)
       ORDER BY date DESC`
    );
    stats.daily_connections = dailyConnectionsResult.rows;
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Get settings
router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings');
    
    // Convert to key-value object
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Update settings
router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (!value) {
      return res.status(400).json({ message: 'Valeur requise' });
    }
    
    const result = await pool.query(
      'UPDATE settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *',
      [value, key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paramètre non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;