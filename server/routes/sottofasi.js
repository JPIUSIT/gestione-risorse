const express = require('express');
const router = express.Router();
const db = require('../database');

// GET sottofasi per BU
router.get('/:buId', (req, res) => {
  const rows = db.prepare('SELECT * FROM sottofasi WHERE bu_id=?').all(req.params.buId);
  res.json(rows);
});

// GET sottofasi per commessa
router.get('/commessa/:comId', (req, res) => {
  const rows = db.prepare('SELECT * FROM sottofasi WHERE com_id=?').all(req.params.comId);
  res.json(rows);
});

// POST nuova sottofase
router.post('/', (req, res) => {
  const { com_id, bu_id, nome, scad, stato } = req.body;
  const id = `sf_${Date.now()}`;
  db.prepare('INSERT INTO sottofasi (id, com_id, bu_id, nome, scad, stato) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, com_id, bu_id, nome, scad || null, stato || 'In corso');
  res.json({ id, com_id, bu_id, nome, scad, stato: stato || 'In corso' });
});

// PUT modifica sottofase
router.put('/:id', (req, res) => {
  const { nome, scad, stato } = req.body;
  db.prepare('UPDATE sottofasi SET nome=?, scad=?, stato=? WHERE id=?')
    .run(nome, scad || null, stato, req.params.id);
  res.json({ ok: true });
});

// DELETE elimina sottofase
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sottofasi WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;