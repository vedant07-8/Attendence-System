const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Faculty = require('../models/Faculty');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper to normalize date string (YYYY-MM-DD) to UTC midnight date
 * @param {string|Date} dateInput 
 * @returns {Date}
 */
const normalizeDate = (dateInput) => {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
};

// @desc    Get attendance sheet for marking (students + existing marks for date)
// @route   GET /api/attendance/sheet
// @access  Private (Admin, Faculty)
const getAttendanceSheet = asyncHandler(async (req, res) => {
  const { classId, subjectId, date } = req.query;

  if (!classId || !subjectId || !date) {
    return res.status(400).json({
      success: false,
      message: 'Please provide classId, subjectId, and date (YYYY-MM-DD)'
    });
  }

  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  // Subject verification
  const subject = await Subject.findById(subjectId).populate('class');
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  // Verify faculty authorization: Faculty can only access subjects assigned to them
  if (req.user.role === 'faculty') {
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty || !subject.faculty || subject.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this subject'
      });
    }
  }

  // Fetch all students in this class
  const students = await Student.find({ class: classId })
    .populate('user', 'name email isActive')
    .sort({ rollNumber: 1 });

  // Fetch existing attendance records for this subject and date
  const existingRecords = await Attendance.find({
    subject: subjectId,
    date: normalizedDate
  });

  const recordMap = new Map();
  existingRecords.forEach(r => {
    recordMap.set(r.student.toString(), r.status);
  });

  const sheet = students.map(st => ({
    studentId: st._id,
    rollNumber: st.rollNumber,
    name: st.user ? st.user.name : 'Unknown',
    email: st.user ? st.user.email : '',
    status: recordMap.get(st._id.toString()) || null // 'present' | 'absent' | null
  }));

  const isAlreadyMarked = existingRecords.length > 0;

  res.json({
    success: true,
    classId,
    subjectId,
    date: normalizedDate.toISOString().split('T')[0],
    isAlreadyMarked,
    totalStudents: students.length,
    markedCount: existingRecords.length,
    students: sheet
  });
});

// @desc    Submit or update attendance (batch upsert)
// @route   POST /api/attendance/mark
// @access  Private (Faculty, Admin)
const markAttendance = asyncHandler(async (req, res) => {
  const { classId, subjectId, date, records } = req.body;

  if (!classId || !subjectId || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide classId, subjectId, date, and a records array'
    });
  }

  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) {
    return res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD'
    });
  }

  // Subject verification
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  // Determine faculty ID for markedBy field
  let facultyId;
  if (req.user.role === 'faculty') {
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty || !subject.faculty || subject.faculty.toString() !== faculty._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark attendance for your assigned subjects'
      });
    }
    facultyId = faculty._id;
  } else if (req.user.role === 'admin') {
    // If admin is marking, use subject's assigned faculty, or find any faculty
    facultyId = subject.faculty;
    if (!facultyId) {
      const anyFaculty = await Faculty.findOne();
      if (!anyFaculty) {
        return res.status(400).json({
          success: false,
          message: 'No faculty exists to attribute attendance to. Please create a faculty member first.'
        });
      }
      facultyId = anyFaculty._id;
    }
  }

  // Validate status values
  for (const item of records) {
    if (!['present', 'absent'].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${item.status}' for student ${item.studentId}. Must be 'present' or 'absent'.`
      });
    }
  }

  // Execute bulkWrite with upsert to prevent duplicates while enabling smooth updates
  const bulkOps = records.map(r => ({
    updateOne: {
      filter: {
        student: r.studentId,
        subject: subjectId,
        date: normalizedDate
      },
      update: {
        $set: {
          class: classId,
          markedBy: facultyId,
          status: r.status
        }
      },
      upsert: true
    }
  }));

  const result = await Attendance.bulkWrite(bulkOps);

  const presentCount = records.filter(r => r.status === 'present').length;
  const absentCount = records.filter(r => r.status === 'absent').length;

  res.json({
    success: true,
    message: 'Attendance saved successfully',
    summary: {
      total: records.length,
      present: presentCount,
      absent: absentCount,
      upsertedCount: result.upsertedCount || 0,
      modifiedCount: result.modifiedCount || 0
    }
  });
});

// @desc    Get attendance history (for faculty / admin)
// @route   GET /api/attendance/history
// @access  Private (Admin, Faculty)
const getAttendanceHistory = asyncHandler(async (req, res) => {
  const { classId, subjectId, startDate, endDate } = req.query;
  const filter = {};

  if (classId) filter.class = classId;
  if (subjectId) filter.subject = subjectId;

  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = normalizeDate(startDate);
    if (endDate) {
      const end = normalizeDate(endDate);
      end.setUTCDate(end.getUTCDate() + 1);
      filter.date.$lt = end;
    }
  }

  // If faculty, only their assigned subjects unless admin
  if (req.user.role === 'faculty') {
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }
    const mySubjects = await Subject.find({ faculty: faculty._id }).distinct('_id');
    if (filter.subject) {
      if (!mySubjects.map(id => id.toString()).includes(filter.subject.toString())) {
        return res.status(403).json({ success: false, message: 'Not authorized for this subject' });
      }
    } else {
      filter.subject = { $in: mySubjects };
    }
  }

  // Aggregate sessions by date, subject, and class
  const sessions = await Attendance.aggregate([
    { $match: filter },
    {
      $group: {
        _id: {
          date: '$date',
          subject: '$subject',
          class: '$class'
        },
        totalStudents: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.date': -1 } },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id.subject',
        foreignField: '_id',
        as: 'subjectInfo'
      }
    },
    {
      $lookup: {
        from: 'classes',
        localField: '_id.class',
        foreignField: '_id',
        as: 'classInfo'
      }
    },
    { $unwind: '$subjectInfo' },
    { $unwind: '$classInfo' },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        subjectId: '$_id.subject',
        subjectName: '$subjectInfo.name',
        subjectCode: '$subjectInfo.code',
        classId: '$_id.class',
        className: '$classInfo.name',
        totalStudents: '$totalStudents',
        presentCount: '$presentCount',
        absentCount: '$absentCount',
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$presentCount', { $cond: [{ $eq: ['$totalStudents', 0] }, 1, '$totalStudents'] }] },
                100
              ]
            },
            1
          ]
        }
      }
    }
  ]);

  res.json({
    success: true,
    count: sessions.length,
    data: sessions
  });
});

// @desc    Get detailed student attendance records
// @route   GET /api/attendance/student/:studentId
// @access  Private (Student self, Admin, Faculty)
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { subjectId, status } = req.query;

  const student = await Student.findById(studentId).populate('user').populate('class');
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Security guard for student role
  if (req.user.role === 'student' && student.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You cannot view attendance of other students'
    });
  }

  const filter = { student: student._id };
  if (subjectId) filter.subject = subjectId;
  if (status) filter.status = status.toLowerCase();

  const records = await Attendance.find(filter)
    .populate('subject', 'name code')
    .populate({
      path: 'markedBy',
      populate: { path: 'user', select: 'name' }
    })
    .sort({ date: -1 });

  res.json({
    success: true,
    student: {
      id: student._id,
      name: student.user ? student.user.name : '',
      rollNumber: student.rollNumber,
      class: student.class ? student.class.name : ''
    },
    count: records.length,
    data: records
  });
});

module.exports = {
  getAttendanceSheet,
  markAttendance,
  getAttendanceHistory,
  getStudentAttendance
};
