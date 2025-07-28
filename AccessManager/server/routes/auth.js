const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
    
    // Check user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1', 
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    
    const user = userResult.rows[0];
    
    // Check if user is active
    if (!user.active) {
      return res.status(403).json({ message: 'Compte désactivé. Contactez l\'administrateur.' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }
    
    // Update last login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Create token
    const accessToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.ACCESS_TOKEN_SECRET || 'secret',
      { expiresIn: '8h' }
    );
    
    res.json({ 
      token: accessToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      } 
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Register (admin only, implemented in admin routes)

module.exports = router;