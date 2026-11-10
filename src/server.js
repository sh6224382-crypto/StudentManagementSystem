const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({
    path: require('path').resolve(__dirname, '../.env')
});

const mongoose = require('mongoose');
const app = require('./app');

const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('MONGODB_URI is required. Set it in your environment or .env file.');
  process.exit(1);
}

async function startServer() {
  await mongoose.connect(mongoUri);

  const server = app.listen(port, () => {
    console.log(`Student Management API listening on port ${port}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down...`);
    server.close(async (error) => {
      if (error) {
        console.error('Failed to close the HTTP server:', error);
        process.exitCode = 1;
      }

      try {
        await mongoose.connection.close();
      } catch (closeError) {
        console.error('Failed to close the MongoDB connection:', closeError);
        process.exitCode = 1;
      }
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error('Failed to start Student Management API:', error);
  process.exitCode = 1;
});
