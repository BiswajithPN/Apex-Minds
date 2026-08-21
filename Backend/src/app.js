const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const errorHandler = require('./middleware/errorMiddleware');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const jobSeekerRoutes = require('./routes/jobSeekerRoutes');
const employerRoutes = require('./routes/employerRoutes');
const jobRoutes = require('./routes/jobRoutes');
const adminRoutes = require('./routes/adminRoutes');
const fileRoutes = require('./routes/fileRoutes');
const { getAdminStats, getAnalyticsTrends } = require('./controllers/adminController');
const { getProfile, updateProfile } = require('./controllers/jobSeekerController');
const protect = require('./middleware/authMiddleware');

const app = express();

// Security Headers
app.use(helmet());

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS Policy
const allowedOrigins = [env.FRONTEND_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean);
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(null, true); // Allow for hackathon demo
      }
    },
    credentials: true,
  })
);

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many failed auth attempts, please try again later.' },
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body Parser (50kb limit)
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'HireHub API is running smoothly', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobseeker', jobSeekerRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);

// Additional Frontend Compatibility Mappings
app.use('/api/resume', jobSeekerRoutes);
app.use('/api/recommendations', jobSeekerRoutes);
app.use('/api/applications', jobSeekerRoutes);
app.get('/api/users/profile', protect, getProfile);
app.put('/api/users/profile', protect, updateProfile);
app.get('/api/users', adminRoutes);
app.patch('/api/users/:id/status', adminRoutes);
app.put('/api/users/change-password', authRoutes);
app.get('/api/users/:id', employerRoutes);
app.get('/api/analytics/dashboard', protect, getAdminStats);
app.get('/api/analytics/trends', protect, getAnalyticsTrends);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Cannot find ${req.originalUrl} on this server` });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
