const express = require('express');
const router = express.Router();
const db = require('../database');

// GET mapping utente per email
router.get('/me/:email', (req, res) => {
  const row = db.prepare('SELECT * FROM utenti_bu WHERE email=?').get(req.params.email);
  res.json(row || null);
});

// GET tutti gli utenti mappati
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM utenti_bu').all();
  res.json(rows);
});

// POST assegna utente a BU
router.post('/', (req, res) => {
  const { email, bu_id, ruolo } = req.body;
  const id = `ub_${Date.now()}`;
  // Se esiste già aggiorna, altrimenti inserisce
  const existing = db.prepare('SELECT * FROM utenti_bu WHERE email=?').get(email);
  if (existing) {
    db.prepare('UPDATE utenti_bu SET bu_id=?, ruolo=? WHERE email=?').run(bu_id, ruolo, email);
    res.json({ id: existing.id, email, bu_id, ruolo });
  } else {
    db.prepare('INSERT INTO utenti_bu (id, email, bu_id, ruolo) VALUES (?, ?, ?, ?)').run(id, email, bu_id, ruolo);
    res.json({ id, email, bu_id, ruolo });
  }
});

// DELETE rimuovi mapping
router.delete('/:email', (req, res) => {
  db.prepare('DELETE FROM utenti_bu WHERE email=?').run(req.params.email);
  res.json({ ok: true });
});

module.exports = router;