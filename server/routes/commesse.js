const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/:buId', (req, res) => {
  const rows = db.prepare('SELECT * FROM commesse WHERE bu_id=?').all(req.params.buId);
  res.json(rows);
});

router.post('/', (req, res) => {
  const { bu_id, cod, tit, cli, stato, src, sharepoint_url } = req.body;
  const id = `com_${Date.now()}`;
  db.prepare('INSERT INTO commesse (id, bu_id, cod, tit, cli, stato, src, arch, sharepoint_url) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)')
    .run(id, bu_id, cod, tit, cli, stato || 'Pianificata', src || 'Server', sharepoint_url || null);
  res.json({ id, bu_id, cod, tit, cli, stato, src, arch: false, sharepoint_url });
});

router.put('/:id', (req, res) => {
  const { cod, tit, cli, stato, src, arch, sharepoint_url } = req.body;
  db.prepare('UPDATE commesse SET cod=?, tit=?, cli=?, stato=?, src=?, arch=?, sharepoint_url=? WHERE id=?')
    .run(cod, tit, cli, stato, src, arch ? 1 : 0, sharepoint_url || null, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM commesse WHERE id=?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;