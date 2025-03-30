const express = require('express');
const router = express.Router();
const { generateToken, createRoom } = require('../controllers/video.controller');
const { authenticateToken } = require('../middleware/auth');

// Use authentication middleware based on environment
const useAuth = process.env.NODE_ENV === 'production' ? authenticateToken : (req, res, next) => next();

router.post('/token', useAuth, generateToken);
router.post('/room', useAuth, createRoom);

module.exports = router; 