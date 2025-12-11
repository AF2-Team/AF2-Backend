const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/TimelineController');
const { protect } = require('../middleware/authMiddleware'); 

// GET /api/v1/feed/home?page=1&pageSize=20
router.get('/home', protect, timelineController.getHomeFeedUser);

module.exports = router;