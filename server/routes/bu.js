const express = require('express');
const router = express.Router();
const db = require('../database');

// GET tutte le BU
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM bu').all();
  res.json(rows);
});

// POST nuova BU
router.post('/', (req, res) => {
  const { id, nome, codice } = req.body;
  const newId = id || `bu_${Date.now()}`;
  db.prepare('INSERT INTO bu (id, nome, codice) VALUES (?, ?, ?)').run(newId, nome, codice);
  res.json({ id: newId, nome, codice });
});

// PUT modifica BU
router.put('/:id', (req, res) => {
  const { nome, codice } = req.body;
  db.prepare('UPDATE bu SET nome=?, codice=? WHERE id=?').run(nome, codice, req.params.id);
  res.json({ ok: true });
});

// DELETE elimina BU
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM bu WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;