/**
 * CORS Configuration
 * Cấu hình Cross-Origin Resource Sharing cho phép FE kết nối
 */

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'https://quizmeabc.vercel.app',
    'https://www.quizme.com.vn',
    'https://quizme.com.vn',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;

