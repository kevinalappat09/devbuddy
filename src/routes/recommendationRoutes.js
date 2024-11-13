const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const getRecommendations = require("../controllers/recommendationsController");

router.get('/recommendations', auth, getRecommendations);

module.exports = router;