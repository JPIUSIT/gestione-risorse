const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:comId', (req, res) => {
  const rows = db.prepare('SELECT * FROM milestones WHERE com_id=?').all(req.params.comId);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { com_id, bu_id, nome, scad } = req.body;
  const id = `ms_${Date.now()}`;
  db.prepare('INSERT INTO milestones (id, com_id, bu_id, nome, scad) VALUES (?, ?, ?, ?, ?)')
    .run(id, com_id, bu_id, nome, scad||null);
  res.json({ id, com_id, bu_id, nome, scad });
});

router.put('/:id', (req, res) => {
  const { nome, scad } = req.body;
  db.prepare('UPDATE milestones SET nome=?, scad=? WHERE id=?')
    .run(nome, scad||null, req.params.id);
  res.json({ id: req.params.id, nome, scad });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM milestones WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;