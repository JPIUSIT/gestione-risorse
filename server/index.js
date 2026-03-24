const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/bu', require('./routes/bu'));
app.use('/api/commesse', require('./routes/commesse'));
app.use('/api/risorse', require('./routes/risorse'));
app.use('/api/allocazioni', require('./routes/allocazioni'));
app.use('/api/utenti', require('./routes/utenti'));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});