const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'gestione_risorse.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS bu (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    codice TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS categorie (
    id TEXT PRIMARY KEY,
    bu_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    ord INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS risorse (
    id TEXT PRIMARY KEY,
    bu_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    cogn TEXT NOT NULL,
    cat_id TEXT,
    ruolo TEXT,
    email TEXT
  );

CREATE TABLE IF NOT EXISTS commesse (
    id TEXT PRIMARY KEY,
    bu_id TEXT NOT NULL,
    cod TEXT NOT NULL,
    tit TEXT,
    cli TEXT,
    stato TEXT DEFAULT 'Pianificata',
    src TEXT DEFAULT 'Server',
    arch INTEGER DEFAULT 0,
    sharepoint_url TEXT
  );

  CREATE TABLE IF NOT EXISTS sottofasi (
    id TEXT PRIMARY KEY,
    com_id TEXT NOT NULL,
    bu_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    scad TEXT,
    stato TEXT DEFAULT 'In corso'
  );

  CREATE TABLE IF NOT EXISTS allocazioni (
    id TEXT PRIMARY KEY,
    bu_id TEXT NOT NULL,
    ris_id TEXT NOT NULL,
    com_id TEXT NOT NULL,
    sf_id TEXT,
    data TEXT NOT NULL,
    ore REAL DEFAULT 0,
    note TEXT
  );

  CREATE TABLE IF NOT EXISTS utenti_bu (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    bu_id TEXT NOT NULL,
    ruolo TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    com_id TEXT NOT NULL,
    bu_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    scad TEXT
  );
`);

// Seed dati iniziali se il DB è vuoto
const buCount = db.prepare('SELECT COUNT(*) as n FROM bu').get();
if (buCount.n === 0) {
  const insertBU = db.prepare('INSERT INTO bu (id, nome, codice) VALUES (?, ?, ?)');
  insertBU.run('bu1', 'IDR – Idraulica', 'IDR');
  insertBU.run('bu2', 'STR – Strutture', 'STR');
  insertBU.run('bu3', 'AMB – Ambiente', 'AMB');
  console.log('✓ BU seed completato');
}

// Seed commesse e risorse se vuote
const comCount = db.prepare('SELECT COUNT(*) as n FROM commesse').get();
if (comCount.n === 0) {
  const iCom = db.prepare('INSERT INTO commesse (id, bu_id, cod, tit, cli, stato, src, arch) VALUES (?, ?, ?, ?, ?, ?, ?, 0)');
  iCom.run('com1','bu1','19-069','Silea – PPP centrale e TLR Valmadrera','ACINQUE ENERGY GREENWAY SRL','Attiva','Server');
  iCom.run('com2','bu1','22-160','CAP – Sistemi di TLR e distribuzione','CAP HOLDING SPA','Attiva','Server');
  iCom.run('com3','bu1','23-072','EUROCONDOTTE – Allacciamento rete distribuzione','EUROCONDOTTE SRL','Attiva','Server');
  iCom.run('com4','bu1','24-034','SICAM – Ricerca perdite idriche avanzata','SICAM SPA','Attiva','Server');
  iCom.run('com5','bu1','25-012','EDISON – Ampliamento rete','EDISON SPA','Pianificata','Server');
  iCom.run('com6','bu1','SP-001','Impianto Idraulico Capannone A','Rossi Srl','Attiva','SharePoint');
  iCom.run('com7','bu1','SP-002','Revisione Rete Fognaria','Comune di Verona','Pianificata','SharePoint');
  iCom.run('com9','bu2','24-201','Ponte S.Marco – Verifica','COMUNE','Attiva','SharePoint');
  iCom.run('com10','bu2','25-033','Edificio L4 – Sismico','PRIVATO','Pianificata','Server');
  iCom.run('com11','bu3','24-301','Studio impatto – Cava Nord','REGIONE','Attiva','SharePoint');
  console.log('✓ Commesse seed completato');
}

const risCount = db.prepare('SELECT COUNT(*) as n FROM risorse').get();
if (risCount.n === 0) {
  const iRis = db.prepare('INSERT INTO risorse (id, bu_id, nome, cogn, cat_id, ruolo, email) VALUES (?, ?, ?, ?, ?, ?, ?)');
  iRis.run('r1','bu1','Marco','Rossi','c1a','PM','m.rossi@jpius.it');
  iRis.run('r2','bu1','Giulia','Bianchi','c1a','Progettista Senior','g.bianchi@jpius.it');
  iRis.run('r3','bu1','Luca','Ferrari','c1a','Progettista','l.ferrari@jpius.it');
  iRis.run('r4','bu1','Anna','Colombo','c1a','Coordinatore','a.colombo@jpius.it');
  iRis.run('r5','bu1','Paolo','Ricci','c1a','PM','p.ricci@jpius.it');
  iRis.run('r6','bu1','Sara','Moretti','c1a','Progettista','s.moretti@jpius.it');
  iRis.run('r7','bu1','Francesco','Galli','c1a','Progettista Junior','f.galli@jpius.it');
  iRis.run('r8','bu1','Elena','Conti','c1a','Coordinatore','e.conti@jpius.it');
  iRis.run('r9','bu1','Roberto','Mazza','c1b','Disegnatore Senior','r.mazza@jpius.it');
  iRis.run('r10','bu1','Chiara','Fontana','c1b','Disegnatore','c.fontana@jpius.it');
  iRis.run('r11','bu1','Andrea','Sala','c1b','Disegnatore','a.sala@jpius.it');
  iRis.run('r12','bu1','Valentina','Greco','c1b','Disegnatore CAD','v.greco@jpius.it');
  iRis.run('r13','bu1','Alessia','Bruno','c1b','Disegnatore CAD','a.bruno@jpius.it');
  iRis.run('r14','bu2','Giorgio','Mancini','c2a','Strutturista','g.mancini@jpius.it');
  iRis.run('r15','bu2','Paola','Serra','c2a','Progettista','p.serra@jpius.it');
  iRis.run('r16','bu2','Roberto','Fusi','c2b','CAD Op.','r.fusi@jpius.it');
  iRis.run('r17','bu3','Chiara','Longo','c3a','Tecnico','c.longo@jpius.it');
  iRis.run('r18','bu3','Filippo','Neri','c3a','Analista','f.neri@jpius.it');
  console.log('✓ Risorse seed completato');
}

module.exports = db;