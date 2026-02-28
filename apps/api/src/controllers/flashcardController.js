const FlashcardProgress = require('../models/FlashcardProgress');
const Formula = require('../models/Formula');
const Flashcard = require('../models/Flashcard');
const User = require('../models/User');
const XPHistory = require('../models/XPHistory');

// @desc    Create a custom flashcard
// @route   POST /api/flashcards
// @access  Private
exports.createFlashcard = async (req, res, next) => {
  try {
    const flashcard = await Flashcard.create({
      ...req.body,
      user: req.user.id,
    });

    // Initialize progress
    await FlashcardProgress.create({
      user: req.user.id,
      customFlashcard: flashcard._id,
      nextReviewAt: new Date(),
    });

    res.status(201).json({ success: true, data: flashcard });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all custom flashcards
// @route   GET /api/flashcards
// @access  Private
exports.getFlashcards = async (req, res, next) => {
  try {
    const flashcards = await Flashcard.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: flashcards.length, data: flashcards });
  } catch (error) {
    next(error);
  }
};

// @desc    Update custom flashcard
// @route   PUT /api/flashcards/:id
// @access  Private
exports.updateFlashcard = async (req, res, next) => {
  try {
    let flashcard = await Flashcard.findById(req.params.id);

    if (!flashcard) {
      return res.status(404).json({ success: false, message: 'Flashcard not found' });
    }

    if (flashcard.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    flashcard = await Flashcard.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: flashcard });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete custom flashcard
// @route   DELETE /api/flashcards/:id
// @access  Private
exports.deleteFlashcard = async (req, res, next) => {
  try {
    const flashcard = await Flashcard.findById(req.params.id);

    if (!flashcard) {
      return res.status(404).json({ success: false, message: 'Flashcard not found' });
    }

    if (flashcard.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await flashcard.deleteOne();
    
    // Also delete associated progress
    await FlashcardProgress.deleteOne({ customFlashcard: req.params.id, user: req.user.id });

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

// GET /api/flashcards/me/due
exports.getDueFlashcards = async (req, res, next) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueFlashcards = await FlashcardProgress.find({
      user: req.user.id,
      nextReviewAt: { $lte: tomorrow },
    })
      .populate('formula')
      .populate('customFlashcard')
      .sort({ nextReviewAt: 1 });

    const data = dueFlashcards.map((fp) => {
      const hoursUntilDue = (fp.nextReviewAt - now) / (1000 * 60 * 60);

      let dueStatus;
      if (hoursUntilDue < 0) dueStatus = 'overdue';
      else if (hoursUntilDue < 6) dueStatus = 'due-soon';
      else dueStatus = 'due-today';

      let cardData = {};
      if (fp.formula) {
        cardData = {
          type: 'formula',
          id: fp.formula._id,
          name: fp.formula.title,
          front: fp.formula.title, // For consistency
          back: fp.formula.formula, // For consistency
          latex: fp.formula.formula,
          description: fp.formula.description,
          topic: fp.formula.topic,
        };
      } else if (fp.customFlashcard) {
        cardData = {
          type: 'custom',
          id: fp.customFlashcard._id,
          front: fp.customFlashcard.front,
          back: fp.customFlashcard.back,
          hint: fp.customFlashcard.hint,
          note: fp.customFlashcard.note,
        };
      }

      return {
        id: fp._id, // Progress ID
        ...cardData,
        lastReviewedAt: fp.lastReviewedAt,
        nextReviewAt: fp.nextReviewAt,
        easeFactor: fp.easeFactor,
        interval: fp.interval,
        repetitions: fp.repetitions,
        lapses: fp.lapses,
        dueStatus,
        hoursUntilDue: Math.round(hoursUntilDue * 10) / 10,
      };
    });

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/flashcards/:id/review
exports.reviewFlashcard = async (req, res, next) => {
  try {
    const progress = await FlashcardProgress.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { lastReviewedAt: new Date() },
      { new: true }
    ).populate('formula').populate('customFlashcard');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard progress không tồn tại',
      });
    }

    let cardData = {};
      if (progress.formula) {
        cardData = {
          type: 'formula',
          id: progress.formula._id,
          name: progress.formula.title,
          front: progress.formula.title,
          back: progress.formula.formula,
          latex: progress.formula.formula,
          description: progress.formula.description,
          topic: progress.formula.topic,
        };
      } else if (progress.customFlashcard) {
        cardData = {
          type: 'custom',
          id: progress.customFlashcard._id,
          front: progress.customFlashcard.front,
          back: progress.customFlashcard.back,
          hint: progress.customFlashcard.hint,
          note: progress.customFlashcard.note,
        };
      }

    res.status(200).json({
      success: true,
      data: {
        id: progress._id,
        ...cardData,
        lastReviewedAt: progress.lastReviewedAt,
        nextReviewAt: progress.nextReviewAt,
        easeFactor: progress.easeFactor,
        interval: progress.interval,
        repetitions: progress.repetitions,
        lapses: progress.lapses,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/flashcards/:id/rate
exports.rateFlashcard = async (req, res, next) => {
  try {
    const { rating } = req.body; // 0 hard, 1 good, 2 easy

    let progress = await FlashcardProgress.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).populate('formula').populate('customFlashcard');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Flashcard progress không tồn tại',
      });
    }

    let { easeFactor, interval, repetitions } = progress;

    if (rating === 0) {
      easeFactor = Math.max(1.3, easeFactor - 0.2);
      repetitions = 0;
      interval = 1;
    } else if (rating === 1) {
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      repetitions += 1;
      if (repetitions === 1) interval = 1;
      else if (repetitions === 2) interval = 6;
      else interval = Math.round(interval * easeFactor);
    } else {
      easeFactor = Math.min(2.5, easeFactor + 0.1);
      repetitions += 1;
      if (repetitions === 1) interval = 4;
      else interval = Math.round(interval * easeFactor * 1.3);
    }

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);

    progress.easeFactor = easeFactor;
    progress.interval = interval;
    progress.repetitions = repetitions;
    progress.lastReviewedAt = new Date();
    progress.nextReviewAt = nextReviewAt;
    if (rating === 0) {
      progress.lapses += 1;
    }

    await progress.save();

    const xpEarned = rating === 2 ? 15 : rating === 1 ? 10 : 5;
    await User.findByIdAndUpdate(req.user.id, { $inc: { xp: xpEarned } });

    await XPHistory.create({
      user: req.user.id,
      amount: xpEarned,
      source: 'flashcard',
      description: 'Ôn tập flashcard',
    });

     let cardData = {};
      if (progress.formula) {
        cardData = {
          type: 'formula',
          id: progress.formula._id,
          name: progress.formula.title,
          front: progress.formula.title,
          back: progress.formula.formula,
          latex: progress.formula.formula,
          description: progress.formula.description,
          topic: progress.formula.topic,
        };
      } else if (progress.customFlashcard) {
        cardData = {
          type: 'custom',
          id: progress.customFlashcard._id,
          front: progress.customFlashcard.front,
          back: progress.customFlashcard.back,
          hint: progress.customFlashcard.hint,
          note: progress.customFlashcard.note,
        };
      }

    res.status(200).json({
      success: true,
      data: {
        flashcard: {
          id: progress._id,
          ...cardData,
          lastReviewedAt: progress.lastReviewedAt,
          nextReviewAt: progress.nextReviewAt,
          easeFactor: progress.easeFactor,
          interval: progress.interval,
          repetitions: progress.repetitions,
          lapses: progress.lapses,
        },
        nextReviewAt,
        xpEarned,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/flashcards/me/stats
exports.getFlashcardStats = async (req, res, next) => {
  try {
    const allProgress = await FlashcardProgress.find({ user: req.user.id });

    const now = new Date();

    const stats = {
      totalCards: allProgress.length,
      masteredCards: allProgress.filter(
        (fp) => fp.repetitions >= 3 && fp.interval >= 7
      ).length,
      learningCards: allProgress.filter(
        (fp) => fp.repetitions > 0 && fp.repetitions < 3
      ).length,
      newCards: allProgress.filter((fp) => fp.repetitions === 0).length,
      dueToday: allProgress.filter((fp) => fp.nextReviewAt <= now).length,
      reviewsToday: 0,
      streak: 0,
    };

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/flashcards/formulas
exports.getFormulasAndInitFlashcards = async (req, res, next) => {
  try {
    const formulas = await Formula.find({});

    for (const formula of formulas) {
      await FlashcardProgress.findOneAndUpdate(
        { user: req.user.id, formula: formula._id },
        {
          user: req.user.id,
          formula: formula._id,
          nextReviewAt: new Date(),
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    const progress = await FlashcardProgress.find({ user: req.user.id, formula: { $exists: true } }).populate(
      'formula'
    );

    const data = progress.map((fp) => ({
      id: fp._id,
      formula: {
        id: fp.formula._id,
        name: fp.formula.title,
        latex: fp.formula.formula,
        description: fp.formula.description,
        topic: fp.formula.topic,
      },
      lastReviewedAt: fp.lastReviewedAt,
      nextReviewAt: fp.nextReviewAt,
      easeFactor: fp.easeFactor,
      interval: fp.interval,
      repetitions: fp.repetitions,
      lapses: fp.lapses,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};


