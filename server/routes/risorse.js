const express = require('express');
const router = express.Router();
const db = require('../database');

// GET risorse per BU
router.get('/:buId', (req, res) => {
  const rows = db.prepare('SELECT * FROM risorse WHERE bu_id=?').all(req.params.buId);
  res.json(rows);
});

// POST nuova risorsa
router.post('/', (req, res) => {
  const { bu_id, nome, cogn, cat_id, ruolo, email } = req.body;
  const id = `r_${Date.now()}`;
  db.prepare('INSERT INTO risorse (id, bu_id, nome, cogn, cat_id, ruolo, email) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, bu_id, nome, cogn, cat_id, ruolo, email);
  res.json({ id, bu_id, nome, cogn, cat_id, ruolo, email });
});

// PUT modifica risorsa
router.put('/:id', (req, res) => {
  const { nome, cogn, cat_id, ruolo, email } = req.body;
  db.prepare('UPDATE risorse SET nome=?, cogn=?, cat_id=?, ruolo=?, email=? WHERE id=?')
    .run(nome, cogn, cat_id, ruolo, email, req.params.id);
  res.json({ ok: true });
});

// DELETE elimina risorsa
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM risorse WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;