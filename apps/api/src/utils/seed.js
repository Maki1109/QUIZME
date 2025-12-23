/**
 * Seed Script
 * Sinh dữ liệu mẫu cho database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

const User = require('../models/User');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Question = require('../models/Question');
const Exam = require('../models/Exam');
const Formula = require('../models/Formula');
const Video = require('../models/Video');
const Achievement = require('../models/Achievement');
const Tip = require('../models/Tip');

// Connect to database
connectDB();

// Import data
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Subject.deleteMany();
    await Topic.deleteMany();
    await Question.deleteMany();
    await Exam.deleteMany();
    await Formula.deleteMany();
    await Video.deleteMany();
    await Achievement.deleteMany();
    await Tip.deleteMany();

    console.log('🗑️  Đã xóa dữ liệu cũ');

    // 1. Create Subjects
    const mathSubject = await Subject.create({
      name: 'TOÁN HỌC',
      code: 'MATH',
      available: true,
      description: 'Môn Toán học lớp 12',
      grade: '12',
    });

    console.log('✅ Đã tạo Subjects');

    // 2. Create Topics
    const topic1 = await Topic.create({
      name: 'Hàm số',
      subject: mathSubject._id,
      difficulty: 'Cơ bản',
      subtopics: [
        { name: 'Đạo hàm', description: 'Khái niệm và ứng dụng đạo hàm' },
        { name: 'Cực trị', description: 'Tìm cực trị của hàm số' },
      ],
      color: 'from-blue-500 to-cyan-500',
      order: 1,
    });

    const topic2 = await Topic.create({
      name: 'Mũ & Logarit',
      subject: mathSubject._id,
      difficulty: 'Trung bình',
      subtopics: [
        { name: 'Hàm số mũ', description: 'Định nghĩa và tính chất' },
        { name: 'Hàm số logarit', description: 'Định nghĩa và tính chất' },
      ],
      color: 'from-purple-500 to-pink-500',
      order: 2,
    });

    const topic3 = await Topic.create({
      name: 'Tích phân',
      subject: mathSubject._id,
      difficulty: 'Nâng cao',
      subtopics: [
        { name: 'Nguyên hàm', description: 'Khái niệm nguyên hàm' },
        { name: 'Tích phân xác định', description: 'Tính tích phân xác định' },
      ],
      color: 'from-orange-500 to-red-500',
      order: 3,
    });

    console.log('✅ Đã tạo Topics');

    // 3. Create Questions
    const questions = await Question.insertMany([
      {
        type: 'multiple-choice',
        text: 'Cho khối chóp có diện tích đáy B và thể tích bằng V. Chiều cao của khối chóp đã cho:',
        options: [
          'A. $h = \\frac{3V}{B}$',
          'B. $h = \\frac{1}{3}VB$',
          'C. $h = \\frac{V}{B}$',
          'D. $h = \\frac{3V}{B}$',
        ],
        correctAnswer: 'A',
        topic: topic1._id,
        subject: mathSubject._id,
        difficulty: 'Nhận biết',
        points: 1,
      },
      {
        type: 'true-false',
        text: 'Cho hàm số $f(x) = 2\\sin x - 3x$. Đạo hàm của hàm số là $f\'(x) = 2\\cos x - 3$.',
        correctAnswer: 'true',
        topic: topic1._id,
        subject: mathSubject._id,
        difficulty: 'Thông hiểu',
        points: 1,
      },
      {
        type: 'multiple-choice',
        text: 'Tìm đạo hàm của hàm số $y = x^3 + 2x^2 - 5x + 1$',
        options: [
          'A. $y\' = 3x^2 + 4x - 5$',
          'B. $y\' = 3x^2 + 2x - 5$',
          'C. $y\' = x^3 + 2x^2 - 5$',
          'D. $y\' = 3x^2 + 4x + 1$',
        ],
        correctAnswer: 'A',
        topic: topic1._id,
        subject: mathSubject._id,
        difficulty: 'Vận dụng',
        points: 1,
      },
      {
        type: 'multiple-choice',
        text: 'Giải phương trình $\\log_2(x + 1) = 3$',
        options: ['A. $x = 7$', 'B. $x = 8$', 'C. $x = 9$', 'D. $x = 10$'],
        correctAnswer: 'A',
        topic: topic2._id,
        subject: mathSubject._id,
        difficulty: 'Thông hiểu',
        points: 1,
      },
    ]);

    console.log('✅ Đã tạo Questions');

    // 4. Create Exam
    const exam = await Exam.create({
      title: 'ĐỀ THI TỐT NGHIỆP THPT 2024',
      code: '101',
      source: 'Bộ GD&ĐT',
      subject: mathSubject._id,
      difficulty: 4,
      duration: 90,
      questions: questions.map((q) => q._id),
      totalQuestions: questions.length,
      attempts: 17842,
      avgScore: 7.8,
      isPinned: true,
      isPublished: true,
    });

    console.log('✅ Đã tạo Exams');

    // 5. Create Formulas
    await Formula.insertMany([
      {
        title: 'Công thức đạo hàm cơ bản',
        formula: '(x^n)\' = n·x^(n-1)',
        category: 'Hàm số',
        topic: topic1._id,
        subject: mathSubject._id,
        description: 'Đạo hàm của hàm số lũy thừa',
      },
      {
        title: 'Logarit tích',
        formula: 'log(a·b) = log(a) + log(b)',
        category: 'Mũ & Log',
        topic: topic2._id,
        subject: mathSubject._id,
        description: 'Tính chất logarit của tích',
      },
      {
        title: 'Tích phân từng phần',
        formula: '∫u·dv = u·v - ∫v·du',
        category: 'Tích phân',
        topic: topic3._id,
        subject: mathSubject._id,
        description: 'Công thức tích phân từng phần',
      },
    ]);

    console.log('✅ Đã tạo Formulas');

    // 6. Create Videos
    await Video.insertMany([
      {
        title: 'Khái niệm Hàm số',
        url: 'https://www.youtube.com/watch?v=example1',
        duration: '4:32',
        topic: topic1._id,
        subject: mathSubject._id,
        views: 1200,
        thumbnail: 'https://example.com/thumbnail1.jpg',
      },
      {
        title: 'Phương trình Logarit cơ bản',
        url: 'https://www.youtube.com/watch?v=example2',
        duration: '5:15',
        topic: topic2._id,
        subject: mathSubject._id,
        views: 890,
        thumbnail: 'https://example.com/thumbnail2.jpg',
      },
    ]);

    console.log('✅ Đã tạo Videos');

    // 7. Create Achievements
    await Achievement.insertMany([
      {
        name: '50 Giờ Học',
        icon: '⏱️',
        description: 'Học tập 50 giờ',
        condition: 'totalStudyHours >= 50',
        rarity: 'common',
      },
      {
        name: 'Chiến Thần Hàm Số',
        icon: '⚡',
        description: 'Đạt 90+ điểm Hàm số',
        condition: 'functionScore >= 90',
        rarity: 'rare',
      },
      {
        name: 'Top 10 Đấu Trường',
        icon: '🏆',
        description: 'Vào Top 10 Đấu trường',
        condition: 'battleRank <= 10',
        rarity: 'epic',
      },
      {
        name: 'Chuỗi 7 Ngày',
        icon: '🔥',
        description: 'Học liên tục 7 ngày',
        condition: 'streakDays >= 7',
        rarity: 'common',
      },
    ]);

    console.log('✅ Đã tạo Achievements');

    // 8. Create Tips
    await Tip.insertMany([
      {
        title: "Chiến thuật '3 Vòng' Bất bại",
        content:
          'Vòng 1 (30-40 phút): Chỉ làm 35-40 câu dễ nhất, chắc chắn đúng. Vòng 2 (20-30 phút): Giải quyết các câu vận dụng, đã có ý tưởng. Vòng 3 (Thời gian còn lại): Chinh phục các câu vận dụng cao.',
        category: 'strategy',
        icon: 'Crosshair',
        saves: 234,
        isPublished: true,
      },
      {
        title: "Nghệ thuật 'Lụi' Có Cơ sở",
        content:
          'Khi phải đoán, hãy ưu tiên các đáp án có giá trị đặc biệt (m=0, m=1) hoặc loại trừ các phương án vô lý (ví dụ: bán kính R không thể âm). Đừng bao giờ bỏ trống câu trả lời!',
        category: 'technique',
        icon: 'Dice6',
        saves: 189,
        isPublished: true,
      },
      {
        title: 'Làm chủ Casio - Bấm máy Thần sầu',
        content:
          'Sử dụng thành thạo chức năng TABLE (MODE 8) để khảo sát hàm số, SOLVE để giải phương trình và CALC để thử đáp án. Tiết kiệm hàng phút cho mỗi câu.',
        category: 'calculator',
        icon: 'Zap',
        saves: 156,
        isPublished: true,
      },
    ]);

    console.log('✅ Đã tạo Tips');

    // 9. Create Test User
    const testUser = await User.create({
      fullName: 'Nguyễn Văn A',
      email: 'test@example.com',
      password: '123456',
      studentId: '01000071',
      grade: '12',
      className: '12A1',
      role: 'student',
    });

    console.log('✅ Đã tạo Test User');
    console.log('📧 Email: test@example.com');
    console.log('🔑 Password: 123456');

    console.log('\n🎉 Seed data completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seed
seedData();

