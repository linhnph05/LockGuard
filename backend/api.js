const express = require('express');
const router = express.Router();
const db = require('./db');

router.post('/pir', async (req, res) => {
  const { value } = req.body;
  await db.execute('INSERT INTO pir_logs (value) VALUES (?)', [value]);
  res.sendStatus(200);
});

router.post('/password', async (req, res) => {
  const { value } = req.body;
  await db.execute('INSERT INTO password_logs (value) VALUES (?)', [value]);
  res.sendStatus(200);
});

module.exports = router;
