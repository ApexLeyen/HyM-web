const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');

// In-memory token storage (token -> { username, expiresAt })
const activeSessions = new Map();
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Helper to extract token from request
function extractToken(req) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  if (req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').map(c => c.trim());
    const tokenCookie = cookies.find(c => c.startsWith('hym_token='));
    if (tokenCookie) {
      return tokenCookie.split('=')[1];
    }
  }
  return null;
}

// Authentication Middleware
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado. Debes iniciar sesión.' });
  }

  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ error: 'Sesión inválida o expirada.' });
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'La sesión ha expirado.' });
  }

  req.user = { username: session.username };
  next();
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Por favor ingresa usuario y contraseña.' });
    }

    const isValid = db.verifyAdmin(username.trim(), password);
    if (!isValid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + SESSION_TTL_MS;
    activeSessions.set(token, { username: username.trim(), expiresAt });

    // Set cookie
    res.cookie('hym_token', token, {
      maxAge: SESSION_TTL_MS,
      httpOnly: false, // Accessible to front-end JS for state management
      sameSite: 'lax',
      path: '/'
    });

    res.json({
      success: true,
      token,
      user: { username: username.trim() }
    });
  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    res.status(500).json({ error: 'Error del servidor al procesar inicio de sesión.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const token = extractToken(req);
  if (token) {
    activeSessions.delete(token);
  }
  res.clearCookie('hym_token', { path: '/' });
  res.json({ success: true, message: 'Sesión cerrada exitosamente.' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const token = extractToken(req);
  if (!token) {
    return res.json({ authenticated: false });
  }

  const session = activeSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) activeSessions.delete(token);
    return res.json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    user: { username: session.username }
  });
});

// POST /api/auth/change-password
router.post('/change-password', requireAuth, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 4 caracteres.' });
    }

    const isValid = db.verifyAdmin(req.user.username, currentPassword);
    if (!isValid) {
      return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
    }

    db.updateAdminPassword(req.user.username, newPassword);
    res.json({ success: true, message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña.' });
  }
});

module.exports = {
  router,
  requireAuth
};
