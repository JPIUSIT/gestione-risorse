const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:comId', (req, res) => {
  const rows = db.prepare('SELECT * FROM computo WHERE com_id=?').all(req.params.comId);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { com_id, bu_id, nome, scad, stato, importo } = req.body;
  const id = `cp_${Date.now()}`;
  db.prepare('INSERT INTO computo (id, com_id, bu_id, nome, scad, stato, importo) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, com_id, bu_id, nome, scad||null, stato||'In attesa', importo||0);
  res.json({ id, com_id, bu_id, nome, scad, stato, importo });
});

router.put('/:id', (req, res) => {
  const { nome, scad, stato, importo } = req.body;
  db.prepare('UPDATE computo SET nome=?, scad=?, stato=?, importo=? WHERE id=?')
    .run(nome, scad||null, stato, importo||0, req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM computo WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;