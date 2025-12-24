/**
 * Golden Time Controller
 * Xử lý logic cho Golden Time (Flashcard review)
 */

const FlashcardProgress = require('../models/FlashcardProgress');
const Formula = require('../models/Formula');
const User = require('../models/User');
const XPHistory = require('../models/XPHistory');

// @desc    Lấy danh sách flashcards cần ôn
// @route   GET /api/golden-time/cards
// @access  Private
exports.getCards = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    const cards = await FlashcardProgress.find({
      user: userId,
      nextReviewAt: { $lte: now },
    })
      .populate('formula')
      .sort({ nextReviewAt: 1 })
      .limit(20);

    const result = cards.map(card => {
      const timeLeft = Math.max(0, (card.nextReviewAt - now) / (1000 * 60 * 60));
      let urgency = 'low';
      if (timeLeft < 0) urgency = 'critical';
      else if (timeLeft < 6) urgency = 'high';
      else if (timeLeft < 24) urgency = 'medium';

      return {
        id: card._id,
        topic: card.formula?.topic?.toString() || 'Unknown',
        concept: card.formula?.title || 'Unknown',
        lastReviewed: card.lastReviewedAt,
        urgency,
        timeLeft: Math.round(timeLeft * 10) / 10,
        dueDate: card.nextReviewAt,
        reviewCount: card.repetitions || 0,
        confidenceLevel: card.easeFactor || 2.5,
      };
    });

    res.status(200).json({
      success: true,
      cards: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bắt đầu session ôn tập
// @route   POST /api/golden-time/start-session
// @access  Private
exports.startSession = async (req, res, next) => {
  try {
    const { cardIds } = req.body;
    const userId = req.user.id;

    const query = { user: userId };
    if (cardIds && cardIds.length > 0) {
      query._id = { $in: cardIds };
    } else {
      // Lấy cards cần ôn
      query.nextReviewAt = { $lte: new Date() };
    }

    const flashcards = await FlashcardProgress.find(query)
      .populate('formula')
      .limit(20);

    // Tạo session ID (có thể lưu vào DB nếu cần)
    const sessionId = `session_${Date.now()}_${userId}`;

    res.status(200).json({
      success: true,
      sessionId,
      flashcards: flashcards.map(card => ({
        id: card._id,
        formula: {
          id: card.formula._id,
          title: card.formula.title,
          formula: card.formula.formula,
          description: card.formula.description,
          topic: card.formula.topic,
        },
        lastReviewedAt: card.lastReviewedAt,
        nextReviewAt: card.nextReviewAt,
        easeFactor: card.easeFactor,
        interval: card.interval,
        repetitions: card.repetitions,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit kết quả flashcard
// @route   POST /api/golden-time/review
// @access  Private
exports.reviewCard = async (req, res, next) => {
  try {
    const { sessionId, cardId, remembered, confidenceLevel } = req.body;
    const userId = req.user.id;

    const progress = await FlashcardProgress.findOne({
      _id: cardId,
      user: userId,
    }).populate('formula');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy flashcard',
      });
    }

    // SM-2 Algorithm
    let { easeFactor, interval, repetitions } = progress;

    if (remembered) {
      if (confidenceLevel >= 4) {
        // Easy
        easeFactor = Math.min(2.5, easeFactor + 0.15);
        repetitions += 1;
        if (repetitions === 1) interval = 1;
        else interval = Math.round(interval * easeFactor * 1.3);
      } else if (confidenceLevel >= 3) {
        // Good
        easeFactor = Math.max(1.3, easeFactor - 0.05);
        repetitions += 1;
        if (repetitions === 1) interval = 1;
        else if (repetitions === 2) interval = 6;
        else interval = Math.round(interval * easeFactor);
      } else {
        // Hard but remembered
        easeFactor = Math.max(1.3, easeFactor - 0.15);
        repetitions += 1;
        interval = Math.max(1, Math.round(interval * 0.5));
      }
    } else {
      // Forgot
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      repetitions = 0;
      interval = 1;
      progress.lapses = (progress.lapses || 0) + 1;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    progress.easeFactor = easeFactor;
    progress.interval = interval;
    progress.repetitions = repetitions;
    progress.lastReviewedAt = new Date();
    progress.nextReviewAt = nextReviewDate;
    await progress.save();

    // Tính XP
    const xpEarned = remembered ? (confidenceLevel >= 4 ? 15 : 10) : 5;

    const user = await User.findById(userId);
    if (user) {
      user.xp = (user.xp || 0) + xpEarned;
      await user.save();

      await XPHistory.create({
        user: userId,
        amount: xpEarned,
        source: 'golden_time',
        sourceId: cardId,
        description: `Ôn tập flashcard: ${progress.formula?.title}`,
      });
    }

    res.status(200).json({
      success: true,
      nextReviewDate: nextReviewDate.toISOString(),
      xpEarned,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Hoàn thành session
// @route   POST /api/golden-time/complete-session
// @access  Private
exports.completeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user.id;

    // Tính tổng số cards đã review trong session này
    // (Trong thực tế, có thể lưu session vào DB để track chính xác)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const reviewedToday = await FlashcardProgress.countDocuments({
      user: userId,
      lastReviewedAt: { $gte: today },
    });

    // Tính accuracy (mock - trong thực tế cần track từng review)
    const accuracyRate = 0.75; // Placeholder

    // Tính XP tổng
    const xpEarned = reviewedToday * 10; // 10 XP per card

    res.status(200).json({
      success: true,
      totalReviewed: reviewedToday,
      accuracyRate,
      xpEarned,
    });
  } catch (error) {
    next(error);
  }
};

