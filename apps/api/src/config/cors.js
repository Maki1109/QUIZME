/**
 * CORS Configuration
 * Cấu hình Cross-Origin Resource Sharing cho phép FE kết nối
 */

const corsOptions = {
  origin: function (origin, callback) {
    const isVercelPreview = origin && origin.endsWith('.vercel.app');
    const frontendUrl = (process.env.FRONTEND_URL).replace(/\/$/, "");

    if (!origin || origin.replace(/\/$/, "") === frontendUrl || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;

