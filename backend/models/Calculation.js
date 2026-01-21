const mongoose = require('mongoose');

const CalculationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  expression: {
    type: String,
    required: true
  },
  result: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

CalculationSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('Calculation', CalculationSchema);
