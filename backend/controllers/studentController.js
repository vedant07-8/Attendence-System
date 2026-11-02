const Student = require('../models/Student');
const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');
const asyncHandler = require('../utils/asyncHandler');
const { calculatePercentage, isDefaulter, calculateClassesNeeded, calculateSafeAbsences } = require('../utils/attendanceCalc');

// @desc    Get all students (with class filter & search)
// @route   GET /api/students
// @access  Private (Admin, Faculty)
const getStudents = asyncHandler(async (req, res) => {
  const { classId, search } = req.query;
  const filter = {};

  if (classId) {
    filter.class = classId;
  }

  let students = await Student.find(filter)
    .populate('user', 'name email isActive createdAt')
    .populate('class', 'name year division department')
    .sort({ rollNumber: 1 });

  // Optional text search by student name, email, or rollNumber
  if (search) {
    const s = search.toLowerCase();
    students = students.filter(student => {
      const name = student.user ? student.user.name.toLowerCase() : '';
      const email = student.user ? student.user.email.toLowerCase() : '';
      const roll = student.rollNumber.toLowerCase();
      return name.includes(s) || email.includes(s) || roll.includes(s);
    });
  }

  res.json({
    success: true,
    count: students.length,
    data: students
  });
});

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('user', 'name email isActive')
    .populate('class', 'name year division department');

  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Security check: if student role, can only access their own profile
  if (req.user.role === 'student' && student.user._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: You can only view your own student record'
    });
  }

  res.json({
    success: true,
    data: student
  });
});

// @desc    Create student (creates User + Student records)
// @route   POST /api/students
// @access  Private (Admin only)
const createStudent = asyncHandler(async (req, res) => {
  const { name, email, password, rollNumber, classId, phone } = req.body;

  if (!name || !email || !password || !rollNumber || !classId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, email, password, rollNumber, and classId'
    });
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingEmail) {
    return res.status(400).json({
      success: false,
      message: `User with email '${email}' already exists`
    });
  }

  const existingRoll = await Student.findOne({ rollNumber: rollNumber.trim().toUpperCase() });
  if (existingRoll) {
    return res.status(400).json({
      success: false,
      message: `Student with roll number '${rollNumber}' already exists`
    });
  }

  const classExists = await Class.findById(classId);
  if (!classExists) {
    return res.status(404).json({
      success: false,
      message: 'Specified class does not exist'
    });
  }

  // Create User account
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password,
    role: 'student'
  });

  // Create Student document
  const student = await Student.create({
    user: user._id,
    rollNumber: rollNumber.trim().toUpperCase(),
    class: classId,
    phone: phone ? phone.trim() : ''
  });

  const populated = await Student.findById(student._id)
    .populate('user', 'name email isActive')
    .populate('class', 'name year division department');

  res.status(201).json({
    success: true,
    message: 'Student registered successfully',
    data: populated
  });
});

// @desc    Update student details
// @route   PUT /api/students/:id
// @access  Private (Admin only)
const updateStudent = asyncHandler(async (req, res) => {
  const { name, email, rollNumber, classId, phone, isActive, password } = req.body;

  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  const user = await User.findById(student.user);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'Associated user account not found'
    });
  }

  if (email && email.toLowerCase().trim() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: user._id } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Email '${email}' is already in use`
      });
    }
    user.email = email.toLowerCase().trim();
  }

  if (rollNumber && rollNumber.trim().toUpperCase() !== student.rollNumber) {
    const existingRoll = await Student.findOne({
      rollNumber: rollNumber.trim().toUpperCase(),
      _id: { $ne: student._id }
    });
    if (existingRoll) {
      return res.status(400).json({
        success: false,
        message: `Roll number '${rollNumber}' is already in use`
      });
    }
    student.rollNumber = rollNumber.trim().toUpperCase();
  }

  if (name) user.name = name.trim();
  if (isActive !== undefined) user.isActive = Boolean(isActive);
  if (password && password.trim().length >= 6) {
    user.password = password.trim();
  }
  await user.save();

  if (classId) {
    const classExists = await Class.findById(classId);
    if (!classExists) {
      return res.status(404).json({
        success: false,
        message: 'Specified class does not exist'
      });
    }
    student.class = classId;
  }
  if (phone !== undefined) student.phone = phone.trim();
  await student.save();

  const populated = await Student.findById(student._id)
    .populate('user', 'name email isActive')
    .populate('class', 'name year division department');

  res.json({
    success: true,
    message: 'Student updated successfully',
    data: populated
  });
});

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private (Admin only)
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) {
    return res.status(404).json({
      success: false,
      message: 'Student not found'
    });
  }

  // Delete all attendance records of this student
  await Attendance.deleteMany({ student: student._id });

  // Delete user account
  await User.findByIdAndDelete(student.user);

  // Delete student document
  await Student.findByIdAndDelete(student._id);

  res.json({
    success: true,
    message: 'Student and associated attendance records deleted successfully'
  });
});

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
