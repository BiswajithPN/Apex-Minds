const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
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
const screenerRoutes = require('./routes/screenerRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const { getAdminStats, getAnalyticsTrends } = require('./controllers/adminController');
const { getProfile, updateProfile } = require('./controllers/jobSeekerController');
const protect = require('./middleware/authMiddleware');

const app = express();

// ── GZIP Compression (reduces response size by ~70%) ──────────────────────────
app.use(compression({ level: 6, threshold: 1024 }));

// Security Headers (relaxed for cross-origin API between frontend & backend)
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// CORS Policy
const allowedOrigins = [
  env.FRONTEND_ORIGIN,
  'https://hire-hub-lilac-eight.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);
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
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

const matchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { success: false, message: 'Matching rate limit reached. Try again shortly.' },
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/screener', matchLimiter);
app.use('/api/analysis', matchLimiter);
app.use('/api', apiLimiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Cache-Control headers for GET API responses ───────────────────────────────
app.use((req, res, next) => {
  if (req.method === 'GET') {
    // Short cache for list endpoints (jobs, recommendations)
    if (/\/(jobs|recommendations|all)/.test(req.path)) {
      res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    } else {
      res.set('Cache-Control', 'private, no-cache');
    }
  } else {
    res.set('Cache-Control', 'no-store');
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, message: 'HireHub API is running smoothly', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobseeker', jobSeekerRoutes);
app.use('/api/employer', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/screener', screenerRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/notifications', analysisRoutes);

// Direct Screener & Legacy Project 1 Route Compatibility
app.use('/api/screen-resume', screenerRoutes);
app.use('/api/screen-batch', screenerRoutes);
app.post('/api/screen-resume-text', (req, res, next) => {
  // Rewrite URL so screenerRoutes' /screen-text handler matches
  req.url = '/screen-text';
  screenerRoutes(req, res, next);
});
app.use('/api/audit-jd', screenerRoutes);

// Additional Frontend Compatibility Mappings
app.use('/api/resume', jobSeekerRoutes);
app.use('/api/certifications', jobSeekerRoutes);
app.use('/api/certification', jobSeekerRoutes);
app.use('/api/recommendations', jobSeekerRoutes);
app.use('/api/applications', jobSeekerRoutes);

// Smart polymorphic profile routes
app.get('/api/users/profile', protect, (req, res, next) => {
  if (req.user.role === 'employer') {
    return require('./controllers/employerController').getCompanyProfile(req, res, next);
  }
  return require('./controllers/jobSeekerController').getProfile(req, res, next);
});

app.put('/api/users/profile', protect, (req, res, next) => {
  if (req.user.role === 'employer') {
    return require('./controllers/employerController').updateCompanyProfile(req, res, next);
  }
  return require('./controllers/jobSeekerController').updateProfile(req, res, next);
});

// Employer applicants by job shortcut
app.get('/api/applications/job/:jobId', protect, (req, res, next) => {
  req.params.id = req.params.jobId;
  return require('./controllers/employerController').getApplicantsForJob(req, res, next);
});

// Root route — health check for Vercel
app.get('/', (req, res) => {
  res.json({ success: true, message: 'HireHub API is live', timestamp: new Date() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Cannot find ${req.originalUrl} on this server` });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
