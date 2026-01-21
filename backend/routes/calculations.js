const express = require('express');
const router = express.Router();
const Calculation = require('../models/Calculation');

// Get calculation history for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const calculations = await Calculation.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({ success: true, data: calculations, count: calculations.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save new calculation
router.post('/', async (req, res) => {
  try {
    const calculation = new Calculation(req.body);
    await calculation.save();
    res.status(201).json({ success: true, data: calculation });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete calculation
router.delete('/:calculationId', async (req, res) => {
  try {
    const { calculationId } = req.params;
    const calculation = await Calculation.findByIdAndDelete(calculationId);

    if (!calculation) {
      return res.status(404).json({ success: false, error: 'Calculation not found' });
    }

    res.json({ success: true, data: calculation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all calculations for a user
router.delete('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await Calculation.deleteMany({ userId });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
