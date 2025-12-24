/**
 * Tip Controller
 * Xử lý CRUD operations cho Tip
 */

const Tip = require('../models/Tip');

// @desc    Lấy danh sách tất cả tips
// @route   GET /api/tips
// @access  Public
exports.getTips = async (req, res, next) => {
  try {
    const { category, search } = req.query;

    const query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
      ];
    }

    const tips = await Tip.find(query).sort({ saves: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tips.length,
      data: tips,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Lấy thông tin tip theo ID
// @route   GET /api/tips/:id
// @access  Public
exports.getTip = async (req, res, next) => {
  try {
    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bí kíp',
      });
    }

    res.status(200).json({
      success: true,
      data: tip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tăng lượt lưu tip
// @route   POST /api/tips/:id/save
// @access  Private
exports.saveTip = async (req, res, next) => {
  try {
    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bí kíp',
      });
    }

    tip.saves += 1;
    await tip.save();

    res.status(200).json({
      success: true,
      data: tip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Tạo tip mới
// @route   POST /api/tips
// @access  Private/Admin
exports.createTip = async (req, res, next) => {
  try {
    const tip = await Tip.create(req.body);

    res.status(201).json({
      success: true,
      data: tip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cập nhật tip
// @route   PUT /api/tips/:id
// @access  Private/Admin
exports.updateTip = async (req, res, next) => {
  try {
    const tip = await Tip.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bí kíp',
      });
    }

    res.status(200).json({
      success: true,
      data: tip,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Xóa tip
// @route   DELETE /api/tips/:id
// @access  Private/Admin
exports.deleteTip = async (req, res, next) => {
  try {
    const tip = await Tip.findById(req.params.id);

    if (!tip) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bí kíp',
      });
    }

    await tip.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Xóa bí kíp thành công',
    });
  } catch (error) {
    next(error);
  }
};

