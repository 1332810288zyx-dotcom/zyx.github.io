// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// 连接数据库（本地文件）
const db = new sqlite3.Database('./appointments.db');

// 创建表
db.run(`CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  name TEXT,
  phone TEXT,
  date TEXT,
  time TEXT,
  service TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// API: 获取所有预约（公开时段）
app.get('/api/appointments', (req, res) => {
  db.all('SELECT date, time, service FROM appointments ORDER BY date, time', [], (err, rows) => {
    res.json(rows);
  });
});

// API: 管理员获取所有详情
app.get('/api/admin/appointments', (req, res) => {
  // 此处应增加身份验证（如 session 或 token），简化示例省略
  db.all('SELECT * FROM appointments ORDER BY created_at DESC', [], (err, rows) => {
    res.json(rows);
  });
});

// API: 创建预约（检查冲突）
app.post('/api/appointments', (req, res) => {
  const { name, phone, date, time, service, notes } = req.body;
  // 先检查冲突
  db.get('SELECT id FROM appointments WHERE date = ? AND time = ?', [date, time], (err, row) => {
    if (row) {
      res.status(409).json({ error: '时段已被预约' });
    } else {
      const id = Date.now() + '-' + Math.random().toString(36);
      db.run('INSERT INTO appointments (id, name, phone, date, time, service, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, name, phone, date, time, service, notes], function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json({ success: true, id });
          }
        });
    }
  });
});

// API: 删除预约（管理员）
app.delete('/api/admin/appointments/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM appointments WHERE id = ?', id, function(err) {
    res.json({ success: true });
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));
