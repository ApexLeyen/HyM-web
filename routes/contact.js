const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('./auth');

// POST /api/contact - Public submission from contact form
router.post('/', (req, res) => {
  try {
    const { name, phone, email, subject, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ error: 'El nombre y el mensaje son obligatorios.' });
    }

    const created = db.createContactMessage({
      name: name.trim(),
      phone: (phone || '').trim(),
      email: (email || '').trim(),
      subject: (subject || 'Consulta General').trim(),
      message: message.trim()
    });

    console.log(`[CONTACT] Nuevo mensaje recibido de: ${name} (${phone || email || 'Sin contacto directo'})`);
    res.status(201).json({
      success: true,
      message: '¡Gracias por contactarnos! Tu mensaje ha sido recibido.',
      data: created
    });
  } catch (error) {
    console.error('Error al guardar mensaje de contacto:', error);
    res.status(500).json({ error: 'Error del servidor al procesar el mensaje.' });
  }
});

// GET /api/contact/messages - Protected: Admin can view all messages
router.get('/messages', requireAuth, (req, res) => {
  try {
    const messages = db.getContactMessages();
    res.json(messages);
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({ error: 'Error al obtener mensajes.' });
  }
});

// PATCH /api/contact/messages/:id/read - Protected: Mark as read
router.patch('/messages/:id/read', requireAuth, (req, res) => {
  try {
    db.markContactMessageRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar mensaje.' });
  }
});

// DELETE /api/contact/messages/:id - Protected: Delete message
router.delete('/messages/:id', requireAuth, (req, res) => {
  try {
    const success = db.deleteContactMessage(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Mensaje no encontrado.' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar mensaje.' });
  }
});

module.exports = router;
