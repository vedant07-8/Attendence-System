const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student is required']
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject is required']
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'Class is required']
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: [true, 'Faculty who marked attendance is required']
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required']
    },
    status: {
      type: String,
      enum: {
        values: ['present', 'absent'],
        message: '{VALUE} must be either "present" or "absent"'
      },
      required: [true, 'Attendance status is required']
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index to prevent duplicate attendance entry for a student in a subject on a date
attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

// Secondary indexes for optimized queries
attendanceSchema.index({ class: 1, subject: 1, date: 1 });
attendanceSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
