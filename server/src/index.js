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
