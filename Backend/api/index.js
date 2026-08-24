const app = require('../src/app');
const connectDB = require('../src/config/db');

// Connect to MongoDB (cached for warm invocations)
let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
};
