const express = require('express');
const router = express.Router();
const ChatbotController = require('../controllers/ChatbotController');

// POST /api/chatbot - Send message to chatbot
router.post('/', ChatbotController.handleChatbotRequest);

// GET /api/chatbot/status - Check chatbot status
router.get('/status', ChatbotController.getChatbotStatus);

// POST /api/chatbot/quick-questions - Get contextual quick questions
router.post('/quick-questions', ChatbotController.getQuickQuestions);

module.exports = router;