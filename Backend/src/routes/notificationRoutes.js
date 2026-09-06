const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markNotificationRead,
} = require('../controllers/analysisController');
const protect = require('../middleware/authMiddleware');

router.use(protect);

// GET  /api/notifications       — list notifications for current user
// GET  /api/notifications/all   — alias used by some frontend calls
router.get('/', getNotifications);
router.get('/all', getNotifications);

// PATCH /api/notifications/:id/read — mark a single notification as read
router.patch('/:id/read', markNotificationRead);

module.exports = router;
