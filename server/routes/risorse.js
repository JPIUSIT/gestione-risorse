const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:buId', (req, res) => {
  const rows = db.prepare('SELECT * FROM risorse WHERE bu_id=? ORDER BY cogn, nome').all(req.params.buId);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { bu_id, nome, cogn, cat_id, ruolo, email, esterno, bu_origine } = req.body;
  const id = `r_${Date.now()}`;
  db.prepare('INSERT INTO risorse (id, bu_id, nome, cogn, cat_id, ruolo, email, esterno, bu_origine) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(id, bu_id, nome, cogn, cat_id||null, ruolo||'', email||'', esterno?1:0, bu_origine||null);
  res.json({ id, bu_id, nome, cogn, cat_id, ruolo, email, esterno: esterno?1:0, bu_origine });
});

router.put('/:id', (req, res) => {
  const { nome, cogn, ruolo, email, cat_id, esterno, bu_origine } = req.body;
  db.prepare('UPDATE risorse SET nome=?, cogn=?, ruolo=?, email=?, cat_id=?, esterno=?, bu_origine=? WHERE id=?')
    .run(nome||'', cogn||'', ruolo||'', email||'', cat_id||null, esterno?1:0, bu_origine||null, req.params.id);
  res.json({ id: req.params.id, ...req.body });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM risorse WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;