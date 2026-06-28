try {
  const app = require('../backend/app.js');
  module.exports = app;
} catch (error) {
  module.exports = (req, res) => {
    res.status(500).json({ error: 'Serverless Function Boot Crash', details: error.message, stack: error.stack });
  };
}
