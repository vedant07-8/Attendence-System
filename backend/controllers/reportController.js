const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const asyncHandler = require('../utils/asyncHandler');
const {
  calculatePercentage,
  isDefaulter,
  calculateClassesNeeded,
  calculateSafeAbsences
} = require('../utils/attendanceCalc');

// @desc    Generate defaulters list (overall attendance < 75%)
// @route   GET /api/reports/defaulters
// @access  Private (Admin, Faculty)
const getDefaultersReport = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const matchClass = classId ? { class: new (require('mongoose').Types.ObjectId)(classId) } : {};

  // Find all students matching class
  const students = await Student.find(classId ? { class: classId } : {})
    .populate('user', 'name email')
    .populate('class', 'name year division department')
    .sort({ rollNumber: 1 });

  const defaulters = [];

  for (const student of students) {
    const total = await Attendance.countDocuments({ student: student._id });
    const present = await Attendance.countDocuments({ student: student._id, status: 'present' });
    const absent = total - present;
    const percentage = calculatePercentage(present, total);

    if (total > 0 && percentage < 75) {
      const classesNeeded = calculateClassesNeeded(present, total, 75);
      defaulters.push({
        studentId: student._id,
        rollNumber: student.rollNumber,
        name: student.user ? student.user.name : 'Unknown',
        email: student.user ? student.user.email : '',
        className: student.class ? student.class.name : '',
        total,
        present,
        absent,
        percentage,
        classesNeeded
      });
    }
  }

  // Sort by lowest percentage first
  defaulters.sort((a, b) => a.percentage - b.percentage);

  res.json({
    success: true,
    count: defaulters.length,
    data: defaulters
  });
});

// @desc    Generate monthly attendance report
// @route   GET /api/reports/monthly
// @access  Private (Admin, Faculty)
const getMonthlyReport = asyncHandler(async (req, res) => {
  const { classId, subjectId, month, year } = req.query;

  if (!classId) {
    return res.status(400).json({
      success: false,
      message: 'Please select a class'
    });
  }

  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const currentMonth = month ? parseInt(month) - 1 : new Date().getMonth(); // 0-indexed

  const startDate = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(currentYear, currentMonth + 1, 1, 0, 0, 0));

  const filter = {
    class: classId,
    date: { $gte: startDate, $lt: endDate }
  };

  if (subjectId) {
    filter.subject = subjectId;
  }

  // Fetch students of this class
  const students = await Student.find({ class: classId })
    .populate('user', 'name email')
    .sort({ rollNumber: 1 });

  // Aggregate attendance in this month
  const reportData = await Promise.all(
    students.map(async (st) => {
      const studentFilter = { ...filter, student: st._id };
      const total = await Attendance.countDocuments(studentFilter);
      const present = await Attendance.countDocuments({ ...studentFilter, status: 'present' });
      const absent = total - present;
      const percentage = calculatePercentage(present, total);

      return {
        studentId: st._id,
        rollNumber: st.rollNumber,
        name: st.user ? st.user.name : 'Unknown',
        total,
        present,
        absent,
        percentage,
        isDefaulter: total > 0 && percentage < 75
      };
    })
  );

  const selectedClass = await Class.findById(classId);
  const selectedSubject = subjectId ? await Subject.findById(subjectId) : null;

  res.json({
    success: true,
    meta: {
      year: currentYear,
      month: currentMonth + 1,
      monthName: new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' }),
      className: selectedClass ? selectedClass.name : '',
      subjectName: selectedSubject ? selectedSubject.name : 'All Subjects'
    },
    count: reportData.length,
    data: reportData
  });
});

module.exports = {
  getDefaultersReport,
  getMonthlyReport
};
