const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Class name is required'],
      unique: true,
      trim: true
    },
    year: {
      type: Number,
      required: [true, 'Academic year is required (e.g. 1, 2, 3, 4)'],
      min: [1, 'Year must be at least 1'],
      max: [5, 'Year cannot exceed 5']
    },
    division: {
      type: String,
      required: [true, 'Division/Section is required (e.g. A, B)'],
      trim: true,
      uppercase: true
    },
    department: {
      type: String,
      required: [true, 'Department is required (e.g. Computer Engineering)'],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Class', classSchema);
