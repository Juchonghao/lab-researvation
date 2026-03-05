const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// SQLite
const db = new Database(path.join(__dirname, 'bookings.db'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    equip_name TEXT NOT NULL,
    slot TEXT NOT NULL,
    user TEXT NOT NULL,
    note TEXT DEFAULT '',
    UNIQUE(date, equip_name, slot)
  )
`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date)`);

// Add note column if upgrading from old schema
try { db.exec('ALTER TABLE bookings ADD COLUMN note TEXT DEFAULT ""'); } catch (e) { /* column already exists */ }

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// GET /api/bookings?date=YYYY-MM-DD
// Returns: { "设备名": { "08:00": { user, note }, ... }, ... }
const stmtSelect = db.prepare('SELECT equip_name, slot, user, note FROM bookings WHERE date = ?');

app.get('/api/bookings', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'date is required' });
  const rows = stmtSelect.all(date);
  const result = {};
  for (const row of rows) {
    if (!result[row.equip_name]) result[row.equip_name] = {};
    result[row.equip_name][row.slot] = row.note
      ? { user: row.user, note: row.note }
      : row.user;
  }
  res.json(result);
});

// POST /api/bookings
// Body: { date, equipName, slots: ["08:00","08:30"], user, note? }
const stmtInsert = db.prepare(
  'INSERT OR IGNORE INTO bookings (date, equip_name, slot, user, note) VALUES (?, ?, ?, ?, ?)'
);
const insertMany = db.transaction((date, equipName, slots, user, note) => {
  let count = 0;
  for (const slot of slots) {
    const info = stmtInsert.run(date, equipName, slot, user, note || '');
    count += info.changes;
  }
  return count;
});

app.post('/api/bookings', (req, res) => {
  const { date, equipName, slots, user, note } = req.body;
  if (!date || !equipName || !slots || !user) {
    return res.status(400).json({ error: 'missing fields' });
  }
  const count = insertMany(date, equipName, slots, user, note || '');
  res.json({ ok: true, inserted: count });
});

// DELETE /api/bookings
// Body: { date, equipName, slots: ["08:00","08:30"], user }
const stmtDelete = db.prepare(
  'DELETE FROM bookings WHERE date = ? AND equip_name = ? AND slot = ? AND user = ?'
);
const deleteMany = db.transaction((date, equipName, slots, user) => {
  let count = 0;
  for (const slot of slots) {
    const info = stmtDelete.run(date, equipName, slot, user);
    count += info.changes;
  }
  return count;
});

app.delete('/api/bookings', (req, res) => {
  const { date, equipName, slots, user } = req.body;
  if (!date || !equipName || !slots || !user) {
    return res.status(400).json({ error: 'missing fields' });
  }
  const count = deleteMany(date, equipName, slots, user);
  res.json({ ok: true, deleted: count });
});

app.listen(PORT, () => {
  console.log(`Lab reservation server running on http://localhost:${PORT}`);
});
