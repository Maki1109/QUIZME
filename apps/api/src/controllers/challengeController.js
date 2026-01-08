/**
 * Challenge Controller (FIXED: Logic chấm điểm A/B/C/D & Debug)
 * Xử lý logic nộp bài và lấy đề thi
 */
const ChallengeAttempt = require('../models/ChallengeAttempt');
const Question = require('../models/Question');
const DailyChallenge = require('../models/DailyChallenge'); 
const User = require('../models/User');

// --- HÀM PHỤ TRỢ ---
// Chuyển đổi đáp án từ mọi định dạng (A, B, "0", 1...) về Index số (0, 1, 2, 3)
const normalizeAnswer = (ans) => {
  if (ans === undefined || ans === null) return -1; // Không có đáp án
  if (typeof ans === 'number') return ans;
  
  const str = String(ans).trim().toUpperCase();
  const map = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
  
  if (map.hasOwnProperty(str)) return map[str];
  if (!isNaN(str)) return parseInt(str, 10);
  
  return -1; // Không xác định
};

// @desc    Nộp bài thi và lưu kết quả chi tiết
// @route   POST /api/challenges/submit
// @access  Private
exports.submitChallenge = async (req, res, next) => {
  try {
    // Nhận dữ liệu từ Frontend
    // answers structure: [{ questionId: "...", selectedAnswer: 0 }, ...]
    const { answers, timeSpent, challengeId } = req.body;

    // --- DEBUG LOG: Xem Frontend gửi gì lên ---
    console.log("👉 [SUBMIT] User:", req.user.id);
    console.log("👉 [SUBMIT] Payload:", JSON.stringify(req.body, null, 2));

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Dữ liệu bài làm không hợp lệ' });
    }

    let correctCount = 0;
    const processedAnswers = [];

    // 1. Duyệt qua từng câu trả lời để chấm điểm
    const topicStats = {}; // Theo dõi hiệu suất theo chủ đề

    for (const item of answers) {
      // Tìm câu hỏi gốc trong DB để lấy đáp án đúng
      const question = await Question.findById(item.questionId);
      
      if (!question) {
        console.warn(`⚠️ Không tìm thấy câu hỏi ID: ${item.questionId}`);
        continue; 
      }

      // --- LOGIC CHẤM ĐIỂM QUAN TRỌNG ---
      // 1. Lấy đáp án đúng từ DB (Ưu tiên correct_answer, fallback sang correctAnswer)
      const rawDbAnswer = question.correct_answer !== undefined ? question.correct_answer : question.correctAnswer;
      const dbCorrectIndex = normalizeAnswer(rawDbAnswer);
      
      // 2. Lấy đáp án User chọn và chuẩn hóa
      const userSelectIndex = normalizeAnswer(item.selectedAnswer);

      // 3. So sánh
      // Điều kiện: Đáp án DB hợp lệ VÀ khớp với đáp án User
      const isCorrect = (dbCorrectIndex !== -1) && (dbCorrectIndex === userSelectIndex);
      
      if (isCorrect) {
        correctCount++;
      }

      // --- TÍNH TOÁN CHO PHÂN TÍCH ---
      const topic = question.topic || "General";
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0 };
      }
      topicStats[topic].total++;
      if (isCorrect) {
        topicStats[topic].correct++;
      }
      // -------------------------------

      // Debug từng câu (nếu cần thiết thì bật lên)
      // console.log(`Q: ${question._id} | DB: ${dbCorrectIndex} | User: ${userSelectIndex} | Correct: ${isCorrect}`);

      // Đẩy vào mảng đã xử lý để lưu DB
      processedAnswers.push({
        questionId: question._id,
        answer: userSelectIndex !== -1 ? userSelectIndex : 0, // Fallback về 0 nếu user không chọn để tránh lỗi DB
        isCorrect: isCorrect, 
        timeSpent: 0 
      });
    }

    console.log(`👉 [SUBMIT] Kết quả chấm: Đúng ${correctCount}/${answers.length}`);

    // --- TẠO BÁO CÁO PHÂN TÍCH (ANALYSIS) ---
    const analysis = {
      topicPerformance: [],
      weakTopics: [],
      strongTopics: [],
      feedback: ""
    };

    for (const [topic, stats] of Object.entries(topicStats)) {
      const accuracy = (stats.correct / stats.total) * 100;
      analysis.topicPerformance.push({
        topic,
        total: stats.total,
        correct: stats.correct,
        accuracy: Math.round(accuracy)
      });

      if (accuracy < 50) {
        analysis.weakTopics.push(topic);
      } else if (accuracy >= 80) {
        analysis.strongTopics.push(topic);
      }
    }

    // Tạo feedback dựa trên tổng điểm
    const overallAccuracy = (correctCount / answers.length) * 100;
    if (overallAccuracy === 100) {
      analysis.feedback = "Tuyệt vời! Bạn đã trả lời đúng tất cả các câu hỏi. Hãy thử thách bản thân với độ khó cao hơn!";
    } else if (overallAccuracy >= 80) {
      analysis.feedback = "Làm tốt lắm! Bạn nắm vững kiến thức rất tốt. Cố gắng phát huy nhé!";
    } else if (overallAccuracy >= 50) {
      analysis.feedback = "Kết quả khá tốt. Hãy ôn lại những phần chưa làm đúng để cải thiện hơn.";
    } else {
      analysis.feedback = "Đừng nản lòng! Hãy xem lại các kiến thức cơ bản và thử lại. Bạn sẽ làm tốt hơn lần sau!";
    }
    // ----------------------------------------

    // 2. Tính điểm và XP
    const score = correctCount * 10; // Ví dụ: 10 điểm / câu
    let xpEarned = correctCount * 20; // 20 XP / câu đúng
    
    // Thưởng thêm nếu đúng hết (Bonus)
    if (answers.length > 0 && correctCount === answers.length) {
      xpEarned += 50;
    }

    // 3. Tạo bản ghi vào DB
    const attempt = await ChallengeAttempt.create({
      user: req.user.id, // Lấy từ middleware auth
      challenge: challengeId || null, // Có thể null nếu là bài luyện tập tự do
      answers: processedAnswers,
      score: score,
      correctAnswers: correctCount,
      totalQuestions: answers.length,
      totalTimeSpent: timeSpent || 0,
      xpEarned: xpEarned,
      completedAt: new Date()
    });

    // 4. Trả kết quả về cho Client
    res.status(200).json({
      success: true,
      data: attempt,
      analysis: analysis, // <--- TRẢ VỀ PHẦN PHÂN TÍCH
      message: "Nộp bài thành công!"
    });

  } catch (error) {
    console.error("❌ [SUBMIT ERROR]:", error);
    // Trả về lỗi 400/500 rõ ràng để Frontend biết
    res.status(400).json({ 
      success: false, 
      message: 'Lỗi khi lưu kết quả bài thi',
      error: error.message 
    });
  }
};

// @desc    Lấy đề Daily Challenge
// @route   GET /api/challenges/daily
exports.getDailyChallenge = async (req, res, next) => {
  try {
    // Logic lấy ngẫu nhiên 5 câu hỏi active
    const questions = await Question.aggregate([
       { $match: { isActive: true } }, // Chỉ lấy câu hỏi đang kích hoạt
       { $sample: { size: 5 } }        // Lấy ngẫu nhiên 5 câu
    ]);
    
    // Ẩn đáp án đúng trước khi gửi về client để bảo mật
    const sanitizedQuestions = questions.map(q => {
      // Loại bỏ các trường đáp án đúng khỏi object trả về
      const { correctAnswer, correct_answer, explanation, ...rest } = q;
      return rest;
    });

    res.status(200).json({
      success: true,
      data: sanitizedQuestions
    });
  } catch (error) {
    next(error);
  }
};

// controllers/challengeController.js

// @desc    Lấy lịch sử làm bài (KÈM CHI TIẾT CÂU HỎI)
// @route   GET /api/challenges/history
exports.getChallengeHistory = async (req, res, next) => {
  try {
    const history = await ChallengeAttempt.find({ user: req.user.id })
      .sort({ completedAt: -1 })
      .limit(20)
      // 👇 THÊM ĐOẠN NÀY: Để lấy chi tiết câu hỏi từ bảng Questions
      .populate({
        path: 'answers.questionId',
        select: 'question options correct_answer correctAnswer explanation topic difficulty' 
      });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy Streak (Chuỗi ngày liên tiếp)
// @route   GET /api/challenges/streak
exports.getChallengeStreak = async (req, res, next) => {
    // Logic streak giữ nguyên hoặc phát triển thêm sau
    res.status(200).json({ success: true, data: { currentStreak: 0 } });
};