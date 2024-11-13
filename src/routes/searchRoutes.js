const express = require('express');
const router = express.Router();

// Import the searchLanguage controller
const searchLanguage = require('../controllers/searchController');

// Define the route that will trigger the searchLanguage function
router.get('/:language', searchLanguage);

module.exports = router;
