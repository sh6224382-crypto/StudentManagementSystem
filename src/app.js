const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const studentRoutes = require('./routes/studentRoutes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/students', studentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
