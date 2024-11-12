// routes/userRoutes.js
const express = require('express');
const auth = require('../middleware/auth');
const { getProfile, getInitPreferences } = require('../controllers/userController');

const router = express.Router();

// Route to get profile information
router.get('/profile', auth, getProfile);

// Route to get the init_preferences of the user
router.get('/init-preferences', auth, getInitPreferences);

module.exports = router;
