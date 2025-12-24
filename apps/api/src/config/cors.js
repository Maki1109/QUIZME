/**
 * CORS Configuration
 * Cấu hình Cross-Origin Resource Sharing cho phép FE kết nối
 */

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://quizmeabc.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;

