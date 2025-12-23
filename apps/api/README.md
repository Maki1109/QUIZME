# QuizMe Backend API

Backend API cho ứng dụng QuizMe - Nền tảng học tập và thi trắc nghiệm Toán học.

## 📋 Mục lục

- [Giới thiệu](#giới-thiệu)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt](#cài-đặt)
- [Cấu hình](#cấu-hình)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [API Endpoints](#api-endpoints)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Models](#models)

## 🎯 Giới thiệu

Backend API được xây dựng theo mô hình MVC (Model-View-Controller) sử dụng:
- **Express.js** - Web framework
- **MongoDB + Mongoose** - Database và ODM
- **JWT** - Xác thực người dùng
- **bcryptjs** - Mã hóa mật khẩu

API cung cấp đầy đủ các endpoints để:
- Đăng ký/Đăng nhập người dùng
- Quản lý đề thi và câu hỏi
- Làm bài thi và lưu kết quả
- Quản lý chuyên đề, công thức, video bài giảng
- Theo dõi năng lực và thành tích người dùng

## 🛠 Công nghệ sử dụng

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM cho MongoDB
- **JWT** - JSON Web Token cho authentication
- **bcryptjs** - Mã hóa mật khẩu
- **dotenv** - Quản lý biến môi trường
- **cors** - CORS middleware
- **helmet** - Security headers
- **morgan** - HTTP request logger
- **express-validator** - Validation middleware
- **nodemon** - Development server với auto-reload

## 📦 Cài đặt

### Yêu cầu

- Node.js >= 14.0.0
- MongoDB >= 4.4
- npm hoặc pnpm

### Bước 1: Clone repository

```bash
cd apps/api
```

### Bước 2: Cài đặt dependencies

```bash
npm install
# hoặc
pnpm install
```

### Bước 3: Tạo file .env

Copy file `.env.example` và đổi tên thành `.env`:

```bash
cp .env.example .env
```

Sau đó chỉnh sửa các giá trị trong file `.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/quizme
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:3000
```

### Bước 4: Đảm bảo MongoDB đang chạy

```bash
# Khởi động MongoDB (nếu chưa chạy)
# macOS/Linux:
sudo service mongod start
# hoặc
mongod

# Windows:
net start MongoDB
```

## 🚀 Chạy ứng dụng

### Development mode (với nodemon)

```bash
npm run dev
```

### Production mode

```bash
npm start
```

### Seed dữ liệu mẫu

```bash
npm run seed
```

Sau khi seed, bạn sẽ có:
- 1 user test: `test@example.com` / `123456`
- Các subjects, topics, questions, exams, formulas, videos mẫu

Server sẽ chạy tại: `http://localhost:5000`

## 📡 API Endpoints

### Authentication

|✅ Authentication
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me

✅ User Management
GET  /api/users/me
PUT  /api/users/me
GET  /api/users/me/xp
POST /api/users/me/xp/add
GET  /api/users/me/xp/history

✅ Streak System (Basic)
GET  /api/users/me/streak
POST /api/users/me/streak/checkin

✅ Exams & Questions
GET  /api/exams
GET  /api/exams/:id
POST /api/exams (admin)
POST /api/exams/factory
GET  /api/questions
POST /api/questions (admin)

✅ Exam Attempts
POST /api/exam-attempts/start
PUT  /api/exam-attempts/:id/answer
POST /api/exam-attempts/:id/submit
GET  /api/exam-attempts
GET  /api/exam-attempts/:id

✅ Achievements
GET  /api/achievements
GET  /api/achievements/progress
POST /api/achievements/:id/unlock

✅ Missions
GET  /api/missions/daily
PATCH /api/missions/:id/progress
POST /api/missions/:id/complete

✅ Leaderboard
GET  /api/leaderboard/weekly
GET  /api/leaderboard/monthly
GET  /api/leaderboard/alltime
GET  /api/leaderboard/friends

✅ Content Management
GET  /api/subjects
GET  /api/topics
GET  /api/formulas
GET  /api/tips

## 📁 Cấu trúc dự án

```
apps/api/
├── src/
│   ├── config/          # Cấu hình (database, cors, etc.)
│   │   ├── database.js
│   │   └── cors.js
│   ├── controllers/     # Xử lý logic nghiệp vụ
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── examController.js
│   │   ├── questionController.js
│   │   └── ...
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Exam.js
│   │   ├── Question.js
│   │   └── ...
│   ├── routes/          # Route definitions
│   │   ├── auth.js
│   │   ├── exams.js
│   │   └── ...
│   ├── middleware/      # Middleware (auth, error handling)
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── utils/           # Utility functions
│   │   ├── logger.js
│   │   └── seed.js
│   └── app.js           # Express app entry point
├── .env.example         # Environment variables template
├── package.json
└── README.md
```

##  Models

### User
- Thông tin người dùng (học sinh, giáo viên, admin)
- Authentication và authorization
- Thông tin profile, streak, achievements, xp, level

### Subject
- Môn học (Toán, Lý, Hóa, etc.)

### Topic
- Chuyên đề kiến thức trong mỗi môn học

### Exam
- Đề thi/kiểm tra
- Chứa danh sách questions

### Question
- Câu hỏi (multiple-choice, true-false, essay)
- Thuộc topic và subject

### ExamAttempt
- Kết quả làm bài thi của user
- Lưu answers, score, timeSpent

### Formula
- Công thức toán học
- Thuộc topic và subject

### Achievement
- Thành tích/huy hiệu

### Mission
- Nhiệm vụ hàng ngày của người dùng
- Các loại: complete_exam, complete_questions, study_time, streak, score_goal

### XPHistory
- Lịch sử tích lũy XP của người dùng
- Lưu lại nguồn gốc XP (exam, mission, achievement, etc.)

### Competency
- Năng lực/điểm số theo chuyên đề của user

### Tip
- Bí kíp/thủ thuật học tập

