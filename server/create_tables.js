const db = require('./database');
try {
  db.exec("CREATE TABLE IF NOT EXISTS computo (id TEXT PRIMARY KEY, com_id TEXT NOT NULL, bu_id TEXT NOT NULL, nome TEXT NOT NULL, scad TEXT, stato TEXT DEFAULT 'In attesa', importo REAL DEFAULT 0)");
  db.exec("CREATE TABLE IF NOT EXISTS sicurezza (id TEXT PRIMARY KEY, com_id TEXT NOT NULL, bu_id TEXT NOT NULL, nome TEXT NOT NULL, scad TEXT, stato TEXT DEFAULT 'In attesa')");
  console.log('Tabelle create ok');
} catch(e) { console.error(e) }