const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const asyncHandler = require('../utils/asyncHandler');
const {
  calculatePercentage,
  isDefaulter,
  calculateClassesNeeded,
  calculateSafeAbsences
} = require('../utils/attendanceCalc');

// @desc    Admin dashboard summary metrics & charts data
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
const getAdminDashboard = asyncHandler(async (req, res) => {
  const [totalStudents, totalFaculty, totalClasses, totalSubjects] = await Promise.all([
    Student.countDocuments(),
    Faculty.countDocuments(),
    Class.countDocuments(),
    Subject.countDocuments()
  ]);

  // Overall attendance statistics
  const [overallPresent, overallTotal] = await Promise.all([
    Attendance.countDocuments({ status: 'present' }),
    Attendance.countDocuments()
  ]);
  const overallPercentage = calculatePercentage(overallPresent, overallTotal);

  // Defaulters count & preview (< 75% overall)
  const studentStats = await Attendance.aggregate([
    {
      $group: {
        _id: '$student',
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        student: '$_id',
        total: 1,
        present: 1,
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$present', { $cond: [{ $eq: ['$total', 0] }, 1, '$total'] }] },
                100
              ]
            },
            1
          ]
        }
      }
    },
    { $match: { percentage: { $lt: 75 } } },
    { $sort: { percentage: 1 } },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentData'
      }
    },
    { $unwind: '$studentData' },
    {
      $lookup: {
        from: 'users',
        localField: 'studentData.user',
        foreignField: '_id',
        as: 'userData'
      }
    },
    {
      $lookup: {
        from: 'classes',
        localField: 'studentData.class',
        foreignField: '_id',
        as: 'classData'
      }
    },
    { $unwind: '$userData' },
    { $unwind: { path: '$classData', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        studentId: '$student',
        rollNumber: '$studentData.rollNumber',
        name: '$userData.name',
        className: '$classData.name',
        total: 1,
        present: 1,
        percentage: 1
      }
    }
  ]);

  const defaultersCount = studentStats.length;
  const defaultersPreview = studentStats.slice(0, 5);

  // 14-day attendance trend for line chart
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const trendData = await Attendance.aggregate([
    { $match: { date: { $gte: fourteenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        _id: 0,
        date: '$_id',
        total: 1,
        present: 1,
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$present', { $cond: [{ $eq: ['$total', 0] }, 1, '$total'] }] },
                100
              ]
            },
            1
          ]
        }
      }
    }
  ]);

  // Class-wise attendance comparison for bar chart
  const classStats = await Attendance.aggregate([
    {
      $group: {
        _id: '$class',
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'classes',
        localField: '_id',
        foreignField: '_id',
        as: 'classInfo'
      }
    },
    { $unwind: '$classInfo' },
    {
      $project: {
        _id: 0,
        classId: '$_id',
        className: '$classInfo.name',
        total: 1,
        present: 1,
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$present', { $cond: [{ $eq: ['$total', 0] }, 1, '$total'] }] },
                100
              ]
            },
            1
          ]
        }
      }
    },
    { $sort: { className: 1 } }
  ]);

  // Recent 6 marked attendance sessions
  const recentSessions = await Attendance.aggregate([
    {
      $group: {
        _id: { date: '$date', subject: '$subject', class: '$class' },
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.date': -1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id.subject',
        foreignField: '_id',
        as: 'subject'
      }
    },
    {
      $lookup: {
        from: 'classes',
        localField: '_id.class',
        foreignField: '_id',
        as: 'class'
      }
    },
    { $unwind: '$subject' },
    { $unwind: '$class' },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        subjectName: '$subject.name',
        subjectCode: '$subject.code',
        className: '$class.name',
        total: 1,
        present: 1,
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$present', { $cond: [{ $eq: ['$total', 0] }, 1, '$total'] }] },
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
    data: {
      stats: {
        totalStudents,
        totalFaculty,
        totalClasses,
        totalSubjects,
        overallPercentage,
        defaultersCount
      },
      charts: {
        trend: trendData,
        classComparison: classStats
      },
      defaultersPreview,
      recentSessions
    }
  });
});

// @desc    Faculty dashboard summary
// @route   GET /api/dashboard/faculty
// @access  Private (Faculty only)
const getFacultyDashboard = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user._id });
  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: 'Faculty profile not found'
    });
  }

  // Get subjects assigned to this faculty
  const assignedSubjects = await Subject.find({ faculty: faculty._id })
    .populate('class', 'name year division department');

  const subjectIds = assignedSubjects.map(s => s._id);
  const classIds = [...new Set(assignedSubjects.map(s => s.class?._id?.toString()).filter(Boolean))];

  // Count total enrolled students in their classes
  const totalStudents = await Student.countDocuments({ class: { $in: classIds } });

  // Today's date normalized
  const today = new Date();
  const todayNormalized = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));

  // Calculate stats per assigned subject
  const subjectsWithStats = await Promise.all(
    assignedSubjects.map(async (subj) => {
      // Check if marked today
      const todayCount = await Attendance.countDocuments({
        subject: subj._id,
        date: todayNormalized
      });

      // Overall stats for this subject
      const totalRecords = await Attendance.countDocuments({ subject: subj._id });
      const presentRecords = await Attendance.countDocuments({ subject: subj._id, status: 'present' });
      const percentage = calculatePercentage(presentRecords, totalRecords);

      return {
        _id: subj._id,
        name: subj.name,
        code: subj.code,
        class: subj.class,
        isMarkedToday: todayCount > 0,
        totalLectures: await Attendance.distinct('date', { subject: subj._id }).then(d => d.length),
        averageAttendance: percentage
      };
    })
  );

  // Overall attendance rate across all subjects assigned to this faculty
  const [facultyPresent, facultyTotal] = await Promise.all([
    Attendance.countDocuments({ subject: { $in: subjectIds }, status: 'present' }),
    Attendance.countDocuments({ subject: { $in: subjectIds } })
  ]);
  const overallPercentage = calculatePercentage(facultyPresent, facultyTotal);

  // Recent attendance entries marked by this faculty
  const recentHistory = await Attendance.aggregate([
    { $match: { markedBy: faculty._id } },
    {
      $group: {
        _id: { date: '$date', subject: '$subject', class: '$class' },
        total: { $sum: 1 },
        present: {
          $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.date': -1 } },
    { $limit: 8 },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id.subject',
        foreignField: '_id',
        as: 'subject'
      }
    },
    {
      $lookup: {
        from: 'classes',
        localField: '_id.class',
        foreignField: '_id',
        as: 'class'
      }
    },
    { $unwind: '$subject' },
    { $unwind: '$class' },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        subjectName: '$subject.name',
        subjectCode: '$subject.code',
        className: '$class.name',
        total: 1,
        present: 1,
        percentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$present', { $cond: [{ $eq: ['$total', 0] }, 1, '$total'] }] },
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
    data: {
      faculty: {
        id: faculty._id,
        employeeId: faculty.employeeId,
        department: faculty.department
      },
      stats: {
        assignedSubjectsCount: assignedSubjects.length,
        assignedClassesCount: classIds.length,
        totalStudents,
        overallPercentage
      },
      subjects: subjectsWithStats,
      recentHistory
    }
  });
});

// @desc    Student dashboard summary & calculator insights
// @route   GET /api/dashboard/student
// @access  Private (Student only)
const getStudentDashboard = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate('user', 'name email')
    .populate('class', 'name year division department');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student profile not found for this user'
    });
  }

  // Get all subjects belonging to student's class
  const classSubjects = await Subject.find({ class: student.class._id })
    .populate({
      path: 'faculty',
      populate: { path: 'user', select: 'name' }
    });

  // Calculate subject-wise attendance
  let overallPresent = 0;
  let overallTotal = 0;

  const subjectBreakdown = await Promise.all(
    classSubjects.map(async (subj) => {
      const total = await Attendance.countDocuments({
        student: student._id,
        subject: subj._id
      });

      const present = await Attendance.countDocuments({
        student: student._id,
        subject: subj._id,
        status: 'present'
      });

      overallPresent += present;
      overallTotal += total;

      const percentage = calculatePercentage(present, total);
      const defaulter = isDefaulter(present, total, 75);
      const classesNeeded = calculateClassesNeeded(present, total, 75);
      const safeAbsences = calculateSafeAbsences(present, total, 75);

      return {
        subjectId: subj._id,
        subjectName: subj.name,
        subjectCode: subj.code,
        facultyName: subj.faculty && subj.faculty.user ? subj.faculty.user.name : 'Unassigned',
        present,
        absent: total - present,
        total,
        percentage,
        isDefaulter: defaulter,
        classesNeeded,
        safeAbsences
      };
    })
  );

  const overallPercentage = calculatePercentage(overallPresent, overallTotal);
  const overallIsDefaulter = isDefaulter(overallPresent, overallTotal, 75);
  const overallClassesNeeded = calculateClassesNeeded(overallPresent, overallTotal, 75);
  const overallSafeAbsences = calculateSafeAbsences(overallPresent, overallTotal, 75);

  // Recent 6 attendance sessions
  const recentRecords = await Attendance.find({ student: student._id })
    .populate('subject', 'name code')
    .sort({ date: -1 })
    .limit(8);

  res.json({
    success: true,
    data: {
      student: {
        id: student._id,
        rollNumber: student.rollNumber,
        name: student.user ? student.user.name : '',
        email: student.user ? student.user.email : '',
        class: student.class ? student.class.name : '',
        phone: student.phone
      },
      overall: {
        present: overallPresent,
        absent: overallTotal - overallPresent,
        total: overallTotal,
        percentage: overallPercentage,
        isDefaulter: overallIsDefaulter,
        classesNeeded: overallClassesNeeded,
        safeAbsences: overallSafeAbsences
      },
      subjects: subjectBreakdown,
      recentRecords
    }
  });
});

module.exports = {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard
};
