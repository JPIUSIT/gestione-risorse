const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:buId', (req, res) => {
  const rows = db.prepare('SELECT * FROM categorie WHERE bu_id=? ORDER BY ord').all(req.params.buId);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { bu_id, nome, ord } = req.body;
  const id = `cat_${Date.now()}`;
  db.prepare('INSERT INTO categorie (id, bu_id, nome, ord) VALUES (?, ?, ?, ?)').run(id, bu_id, nome, ord||99);
  res.json({ id, bu_id, nome, ord });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM categorie WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;