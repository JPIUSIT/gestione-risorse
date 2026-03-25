const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/bu',         require('./routes/bu'));
app.use('/api/commesse',   require('./routes/commesse'));
app.use('/api/risorse',    require('./routes/risorse'));
app.use('/api/allocazioni',require('./routes/allocazioni'));
app.use('/api/utenti',     require('./routes/utenti'));
app.use('/api/sottofasi',  require('./routes/sottofasi'));
app.use('/api/milestones', require('./routes/milestones'));

// Serve frontend React (build)
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});