const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // fail fast if Atlas unreachable
      socketTimeoutMS: 45000,          // abort slow queries after 45s
      maxPoolSize: 10,                 // max concurrent connections
      minPoolSize: 2,                  // keep warm connections alive
      connectTimeoutMS: 10000,
    });

    console.log(`[MongoDB] Connected to database: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Error] Initial connection failed: ${error.message}`);
  }
};

// Handle connection lifecycle events
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Warning] Disconnected from database. Mongoose auto-reconnecting...');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB Info] Reconnected to database.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB Error] Runtime connection error: ${err.message}`);
});

module.exports = connectDB;
