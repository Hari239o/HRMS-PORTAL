const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const http = require('http');

const PORT = process.env.PORT || 5002;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Office geofence: ${process.env.OFFICE_LAT || 'unset'}, ${process.env.OFFICE_LONG || 'unset'} (radius ${process.env.OFFICE_RADIUS || 'unset'}m)`);
});

// Graceful Shutdown Logic for Cloud Run
const prisma = require('../prisma/client');

const shutdown = async (signal) => {
  console.log(`\n${signal} received. Initiating graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await prisma.$disconnect();
      console.log('Prisma disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('Error during Prisma disconnect:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if not gracefully shutting down
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
