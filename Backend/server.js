const app = require('./src/app');
const env = require('./src/config/env');
const connectDB = require('./src/config/db');

// Connect to MongoDB
connectDB();

const PORT = env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`
  ======================================================
  🚀 HireHub AI Backend Server is live!
  📡 Listening on: http://localhost:${PORT}
  🌐 Environment: ${env.NODE_ENV}
  ======================================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection]', err.message || err);
});
