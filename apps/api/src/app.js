/**
 * Main Express Application
 * File khởi tạo Express app và kết nối các routes, middleware
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');
const corsOptions = require('./config/cors');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/xp', require('./routes/xp'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/exam-attempts', require('./routes/examAttempts'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/formulas', require('./routes/formulas'));
app.use('/api/competencies', require('./routes/competencies'));
app.use('/api/tips', require('./routes/tips'));
app.use('/api/missions', require('./routes/missions'));
app.use('/api/achievements', require('./routes/achievements'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/config', require('./routes/config'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/learning-paths', require('./routes/learningPaths'));
app.use('/api/analytics', require('./routes/analytics'));

// New routes
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/streak', require('./routes/streak'));
app.use('/api/exam-room', require('./routes/examRoom'));
app.use('/api/challenge-5min', require('./routes/challenge5Min'));
app.use('/api/golden-time', require('./routes/goldenTime'));
app.use('/api/tests', require('./routes/testLibrary'));
app.use('/api/roadmap', require('./routes/learningPaths')); // Alias for learning-paths
app.use('/api/profile', require('./routes/profile'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/settings', require('./routes/settings'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

