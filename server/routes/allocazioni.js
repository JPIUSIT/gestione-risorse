const express = require('express');
const router = express.Router();
const db = require('../database');

// GET allocazioni per BU
router.get('/:buId', (req, res) => {
  const rows = db.prepare('SELECT * FROM allocazioni WHERE bu_id=?').all(req.params.buId);
  res.json(rows);
});

// POST nuova allocazione
router.post('/', (req, res) => {
  const { bu_id, ris_id, com_id, data, ore, note } = req.body;
  const id = `al_${Date.now()}`;
  db.prepare('INSERT INTO allocazioni (id, bu_id, ris_id, com_id, data, ore, note) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, bu_id, ris_id, com_id, data, ore || 0, note || '');
  res.json({ id, bu_id, ris_id, com_id, data, ore, note });
});

// DELETE elimina allocazione
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM allocazioni WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;