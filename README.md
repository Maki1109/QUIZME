Quizme guide

## 🎯 Giới thiệu

QuizMe là nền tảng học tập và thi trắc nghiệm Toán học với các tính năng:

- ✅ **Daily Missions** - Nhiệm vụ hàng ngày
- ✅ **XP & Level System** - Hệ thống điểm kinh nghiệm và cấp độ
- ✅ **Study Streak** - Chuỗi ngày học liên tiếp
- ✅ **Achievements** - Thành tích và huy hiệu
- ✅ **Leaderboard** - Bảng xếp hạng
- ✅ **Exam System** - Hệ thống thi trắc nghiệm
- ✅ **Analytics Dashboard** - Dashboard phân tích

---

## 📁 Cấu trúc Project

```
QuizMe/
├── apps/
│   └── api/              # Backend API (Node.js + Express + MongoDB)
│       ├── src/
│       │   ├── controllers/
│       │   ├── models/
│       │   ├── routes/
│       │   └── middleware/
│       └── package.json
│
├── FE/                    # Frontend (React + TypeScript + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── services/      # API services
│   │   ├── contexts/      # React contexts
│   │   └── App.tsx
│   └── package.json
│
├── SETUP_GUIDE.md         # Hướng dẫn setup chi tiết
├── POSTMAN_TESTING_GUIDE.md  # Hướng dẫn test API
├── INTEGRATION_GUIDE.md   # Hướng dẫn tích hợp FE-BE
└── README.md             # File này
```

---

## 🚀 Quick Start

### Yêu cầu

- Node.js >= 14.0.0
- MongoDB >= 4.4
- npm/pnpm/yarn

### 1. Setup Backend

```bash
# Di chuyển vào thư mục backend
cd apps/api

# Cài đặt dependencies
npm install

# Tạo file .env
# Copy nội dung từ .env.example và chỉnh sửa:
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/quizme
# JWT_SECRET=your-secret-key
# FRONTEND_URL=http://localhost:3000

# Khởi động MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Seed dữ liệu mẫu (tùy chọn)
npm run seed

# Chạy backend
npm run dev
```

Backend chạy tại: `http://localhost:5000`

### 2. Setup Frontend

```bash
# Di chuyển vào thư mục frontend
cd FE

# Cài đặt dependencies
npm install

# Tạo file .env
# VITE_API_URL=http://localhost:5000/api

# Chạy frontend
npm run dev
```

Frontend chạy tại: `http://localhost:3000`

