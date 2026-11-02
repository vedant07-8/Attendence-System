const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Faculty = require('../models/Faculty');
const Attendance = require('../models/Attendance');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all subjects (filterable by classId or facultyId)
// @route   GET /api/subjects
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
  const { classId, facultyId } = req.query;
  const filter = {};

  if (classId) filter.class = classId;
  if (facultyId) filter.faculty = facultyId;

  const subjects = await Subject.find(filter)
    .populate('class', 'name year division department')
    .populate({
      path: 'faculty',
      select: 'employeeId department user',
      populate: { path: 'user', select: 'name email' }
    })
    .sort({ code: 1 });

  res.json({
    success: true,
    data: subjects
  });
});

// @desc    Get single subject by ID
// @route   GET /api/subjects/:id
// @access  Private
const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('class', 'name year division department')
    .populate({
      path: 'faculty',
      select: 'employeeId department user',
      populate: { path: 'user', select: 'name email' }
    });

  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  res.json({
    success: true,
    data: subject
  });
});

// @desc    Create new subject
// @route   POST /api/subjects
// @access  Private (Admin only)
const createSubject = asyncHandler(async (req, res) => {
  const { name, code, classId, facultyId } = req.body;

  if (!name || !code || !classId) {
    return res.status(400).json({
      success: false,
      message: 'Subject name, unique code, and class assignment are required'
    });
  }

  const classExists = await Class.findById(classId);
  if (!classExists) {
    return res.status(404).json({
      success: false,
      message: 'Specified class does not exist'
    });
  }

  if (facultyId) {
    const facultyExists = await Faculty.findById(facultyId);
    if (!facultyExists) {
      return res.status(404).json({
        success: false,
        message: 'Specified faculty does not exist'
      });
    }
  }

  const existingCode = await Subject.findOne({ code: code.trim().toUpperCase() });
  if (existingCode) {
    return res.status(400).json({
      success: false,
      message: `Subject with code '${code.trim().toUpperCase()}' already exists`
    });
  }

  const subject = await Subject.create({
    name: name.trim(),
    code: code.trim().toUpperCase(),
    class: classId,
    faculty: facultyId || null
  });

  const populated = await Subject.findById(subject._id)
    .populate('class', 'name year division department')
    .populate({
      path: 'faculty',
      populate: { path: 'user', select: 'name email' }
    });

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: populated
  });
});

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Admin only)
const updateSubject = asyncHandler(async (req, res) => {
  const { name, code, classId, facultyId } = req.body;

  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  if (code && code.trim().toUpperCase() !== subject.code) {
    const existing = await Subject.findOne({
      code: code.trim().toUpperCase(),
      _id: { $ne: subject._id }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Subject code '${code}' is already used by another subject`
      });
    }
    subject.code = code.trim().toUpperCase();
  }

  if (name) subject.name = name.trim();
  if (classId) subject.class = classId;
  if (facultyId !== undefined) {
    subject.faculty = facultyId || null;
  }

  await subject.save();

  const populated = await Subject.findById(subject._id)
    .populate('class', 'name year division department')
    .populate({
      path: 'faculty',
      populate: { path: 'user', select: 'name email' }
    });

  res.json({
    success: true,
    message: 'Subject updated successfully',
    data: populated
  });
});

// @desc    Assign faculty to subject
// @route   PUT /api/subjects/:id/assign-faculty
// @access  Private (Admin only)
const assignFaculty = asyncHandler(async (req, res) => {
  const { facultyId } = req.body;

  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  if (facultyId) {
    const faculty = await Faculty.findById(facultyId);
    if (!faculty) {
      return res.status(404).json({
        success: false,
        message: 'Faculty member not found'
      });
    }
    subject.faculty = facultyId;
  } else {
    subject.faculty = null;
  }

  await subject.save();

  const populated = await Subject.findById(subject._id)
    .populate('class', 'name')
    .populate({
      path: 'faculty',
      populate: { path: 'user', select: 'name email' }
    });

  res.json({
    success: true,
    message: facultyId ? 'Faculty assigned successfully' : 'Faculty unassigned successfully',
    data: populated
  });
});

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin only)
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  const attendanceCount = await Attendance.countDocuments({ subject: subject._id });
  if (attendanceCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete subject. There are ${attendanceCount} attendance record(s) logged under this subject.`
    });
  }

  await Subject.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Subject deleted successfully'
  });
});

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  assignFaculty,
  deleteSubject
};
