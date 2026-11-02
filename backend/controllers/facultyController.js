const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all faculty members
// @route   GET /api/faculty
// @access  Private (Admin, Faculty)
const getFaculty = asyncHandler(async (req, res) => {
  const facultyMembers = await Faculty.find()
    .populate('user', 'name email isActive createdAt')
    .sort({ 'employeeId': 1 });

  // Attach subjects taught by each faculty member
  const data = await Promise.all(
    facultyMembers.map(async (faculty) => {
      const subjects = await Subject.find({ faculty: faculty._id }).populate('class', 'name');
      return {
        ...faculty.toObject(),
        subjects
      };
    })
  );

  res.json({
    success: true,
    data
  });
});

// @desc    Get single faculty member by ID
// @route   GET /api/faculty/:id
// @access  Private
const getFacultyById = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id)
    .populate('user', 'name email isActive');

  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: 'Faculty member not found'
    });
  }

  const subjects = await Subject.find({ faculty: faculty._id }).populate('class', 'name year division department');

  res.json({
    success: true,
    data: {
      ...faculty.toObject(),
      subjects
    }
  });
});

// @desc    Create new faculty member
// @route   POST /api/faculty
// @access  Private (Admin only)
const createFaculty = asyncHandler(async (req, res) => {
  const { name, email, password, employeeId, department } = req.body;

  if (!name || !email || !password || !employeeId || !department) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, email, password, employeeId, and department'
    });
  }

  const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingEmail) {
    return res.status(400).json({
      success: false,
      message: `User with email '${email}' already exists`
    });
  }

  const existingEmp = await Faculty.findOne({ employeeId: employeeId.trim().toUpperCase() });
  if (existingEmp) {
    return res.status(400).json({
      success: false,
      message: `Faculty with employee ID '${employeeId}' already exists`
    });
  }

  // Create User account
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: password,
    role: 'faculty'
  });

  // Create Faculty document
  const faculty = await Faculty.create({
    user: user._id,
    employeeId: employeeId.trim().toUpperCase(),
    department: department.trim()
  });

  const populated = await Faculty.findById(faculty._id)
    .populate('user', 'name email isActive');

  res.status(201).json({
    success: true,
    message: 'Faculty member registered successfully',
    data: populated
  });
});

// @desc    Update faculty member
// @route   PUT /api/faculty/:id
// @access  Private (Admin only)
const updateFaculty = asyncHandler(async (req, res) => {
  const { name, email, employeeId, department, isActive, password } = req.body;

  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: 'Faculty member not found'
    });
  }

  const user = await User.findById(faculty.user);
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

  if (employeeId && employeeId.trim().toUpperCase() !== faculty.employeeId) {
    const existingEmp = await Faculty.findOne({
      employeeId: employeeId.trim().toUpperCase(),
      _id: { $ne: faculty._id }
    });
    if (existingEmp) {
      return res.status(400).json({
        success: false,
        message: `Employee ID '${employeeId}' is already in use`
      });
    }
    faculty.employeeId = employeeId.trim().toUpperCase();
  }

  if (name) user.name = name.trim();
  if (isActive !== undefined) user.isActive = Boolean(isActive);
  if (password && password.trim().length >= 6) {
    user.password = password.trim();
  }
  await user.save();

  if (department) faculty.department = department.trim();
  await faculty.save();

  const populated = await Faculty.findById(faculty._id)
    .populate('user', 'name email isActive');

  res.json({
    success: true,
    message: 'Faculty member updated successfully',
    data: populated
  });
});

// @desc    Delete faculty member
// @route   DELETE /api/faculty/:id
// @access  Private (Admin only)
const deleteFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: 'Faculty member not found'
    });
  }

  // Unassign from all subjects
  await Subject.updateMany({ faculty: faculty._id }, { faculty: null });

  // Delete User account
  await User.findByIdAndDelete(faculty.user);

  // Delete Faculty document
  await Faculty.findByIdAndDelete(faculty._id);

  res.json({
    success: true,
    message: 'Faculty member removed successfully and unassigned from subjects'
  });
});

// @desc    Get currently logged-in faculty assignments
// @route   GET /api/faculty/me/assigned
// @access  Private (Faculty only)
const getMyAssignments = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findOne({ user: req.user._id });
  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: 'Faculty profile not found for this user'
    });
  }

  const subjects = await Subject.find({ faculty: faculty._id })
    .populate('class', 'name year division department')
    .sort({ name: 1 });

  // Extract unique classes
  const classesMap = new Map();
  subjects.forEach(sub => {
    if (sub.class) {
      classesMap.set(sub.class._id.toString(), sub.class);
    }
  });

  res.json({
    success: true,
    faculty,
    subjects,
    classes: Array.from(classesMap.values())
  });
});

module.exports = {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getMyAssignments
};
