const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:comId', (req, res) => {
  const rows = db.prepare('SELECT * FROM sicurezza WHERE com_id=?').all(req.params.comId);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { com_id, bu_id, nome, scad, stato } = req.body;
  const id = `sk_${Date.now()}`;
  db.prepare('INSERT INTO sicurezza (id, com_id, bu_id, nome, scad, stato) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, com_id, bu_id, nome, scad||null, stato||'In attesa');
  res.json({ id, com_id, bu_id, nome, scad, stato });
});

router.put('/:id', (req, res) => {
  const { nome, scad, stato } = req.body;
  db.prepare('UPDATE sicurezza SET nome=?, scad=?, stato=? WHERE id=?')
    .run(nome, scad||null, stato, req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM sicurezza WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;