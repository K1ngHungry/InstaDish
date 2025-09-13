const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');

// Import routes
const recipeRoutes = require('./routes/recipeRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const sustainabilityRoutes = require('./routes/sustainabilityRoutes');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: config.nodeEnv === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Logging middleware
if (config.nodeEnv === 'development') {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/recipes', recipeRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/sustainability', sustainabilityRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'InstaDish API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: '2.0.0'
  });
});

// Serve static files from React app build directory (production)
if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `API endpoint ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.name || 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    ...(config.nodeEnv === 'development' && { stack: error.stack })
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`
🚀 InstaDish Server v2.0.0
📡 Server running on port ${PORT}
🌍 Environment: ${config.nodeEnv}
🤖 Ollama Model: ${config.ollama.model}
🔗 API Base URL: http://localhost:${PORT}/api
📚 API Documentation: http://localhost:${PORT}/api/health
  `);
});

module.exports = app;