const express = require('express');
const router = express.Router();
const db = require('../database');

// GET commesse per BU
router.get('/:buId', (req, res) => {
  const rows = db.prepare('SELECT * FROM commesse WHERE bu_id=?').all(req.params.buId);
  res.json(rows);
});

// POST nuova commessa
router.post('/', (req, res) => {
  const { bu_id, cod, tit, cli, stato, src } = req.body;
  const id = `com_${Date.now()}`;
  db.prepare('INSERT INTO commesse (id, bu_id, cod, tit, cli, stato, src, arch) VALUES (?, ?, ?, ?, ?, ?, ?, 0)')
    .run(id, bu_id, cod, tit, cli, stato || 'Pianificata', src || 'Server');
  res.json({ id, bu_id, cod, tit, cli, stato, src, arch: false });
});

// PUT modifica commessa
router.put('/:id', (req, res) => {
  const { cod, tit, cli, stato, src, arch } = req.body;
  db.prepare('UPDATE commesse SET cod=?, tit=?, cli=?, stato=?, src=?, arch=? WHERE id=?')
    .run(cod, tit, cli, stato, src, arch ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

// DELETE elimina commessa
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM commesse WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;