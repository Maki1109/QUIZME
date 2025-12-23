/**
 * Formula Routes
 * Các route liên quan đến Formula
 */

const express = require('express');
const router = express.Router();
const {
  getFormulas,
  getFormula,
  createFormula,
  updateFormula,
  deleteFormula,
  masterFormula,
} = require('../controllers/formulaController');
const { protect } = require('../middleware/auth');

router.route('/').get(getFormulas).post(protect, createFormula);
router
  .route('/:id')
  .get(getFormula)
  .put(protect, updateFormula)
  .delete(protect, deleteFormula);

router.route('/:id/master').post(protect, masterFormula);

module.exports = router;

