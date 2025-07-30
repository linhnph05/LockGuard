const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const socketio = require('socket.io');
const db = require('./db');
const apiRoutes = require('./api');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketio(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

// Emit latest sensor data to frontend every 2s
setInterval(async () => {
  const [pirRows] = await db.query('SELECT * FROM pir_logs ORDER BY id DESC LIMIT 1');
  const [pwRows]  = await db.query('SELECT * FROM password_logs ORDER BY id DESC LIMIT 1');
  if (pirRows.length) {
    io.emit('pir', { timestamp: pirRows[0].timestamp, value: pirRows[0].value });
  }
  if (pwRows.length) {
    io.emit('password', { timestamp: pwRows[0].timestamp, value: pwRows[0].value });
  }
}, 2000);

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
