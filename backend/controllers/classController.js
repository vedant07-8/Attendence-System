const Class = require('../models/Class');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all classes
// @route   GET /api/classes
// @access  Private (All authenticated roles)
const getClasses = asyncHandler(async (req, res) => {
  const classes = await Class.find().sort({ year: 1, division: 1 });
  
  // Attach student count and subject count to each class
  const populatedClasses = await Promise.all(
    classes.map(async (cls) => {
      const studentCount = await Student.countDocuments({ class: cls._id });
      const subjectCount = await Subject.countDocuments({ class: cls._id });
      return {
        ...cls.toObject(),
        studentCount,
        subjectCount
      };
    })
  );

  res.json({
    success: true,
    data: populatedClasses
  });
});

// @desc    Get single class by ID
// @route   GET /api/classes/:id
// @access  Private
const getClassById = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) {
    return res.status(404).json({
      success: false,
      message: 'Class not found'
    });
  }

  const studentCount = await Student.countDocuments({ class: cls._id });
  const subjects = await Subject.find({ class: cls._id }).populate({
    path: 'faculty',
    populate: { path: 'user', select: 'name email' }
  });

  res.json({
    success: true,
    data: {
      ...cls.toObject(),
      studentCount,
      subjects
    }
  });
});

// @desc    Create new class
// @route   POST /api/classes
// @access  Private (Admin only)
const createClass = asyncHandler(async (req, res) => {
  const { name, year, division, department } = req.body;

  if (!name || !year || !division || !department) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: name, year, division, and department'
    });
  }

  const existing = await Class.findOne({ name: name.trim() });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: `A class named '${name}' already exists`
    });
  }

  const newClass = await Class.create({
    name: name.trim(),
    year: Number(year),
    division: division.trim().toUpperCase(),
    department: department.trim()
  });

  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    data: newClass
  });
});

// @desc    Update class
// @route   PUT /api/classes/:id
// @access  Private (Admin only)
const updateClass = asyncHandler(async (req, res) => {
  const { name, year, division, department } = req.body;

  const cls = await Class.findById(req.params.id);
  if (!cls) {
    return res.status(404).json({
      success: false,
      message: 'Class not found'
    });
  }

  if (name && name.trim() !== cls.name) {
    const existing = await Class.findOne({ name: name.trim(), _id: { $ne: cls._id } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A class named '${name}' already exists`
      });
    }
    cls.name = name.trim();
  }

  if (year !== undefined) cls.year = Number(year);
  if (division) cls.division = division.trim().toUpperCase();
  if (department) cls.department = department.trim();

  await cls.save();

  res.json({
    success: true,
    message: 'Class updated successfully',
    data: cls
  });
});

// @desc    Delete class
// @route   DELETE /api/classes/:id
// @access  Private (Admin only)
const deleteClass = asyncHandler(async (req, res) => {
  const cls = await Class.findById(req.params.id);
  if (!cls) {
    return res.status(404).json({
      success: false,
      message: 'Class not found'
    });
  }

  const studentCount = await Student.countDocuments({ class: cls._id });
  if (studentCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete class. There are ${studentCount} student(s) currently enrolled. Reassign or remove them first.`
    });
  }

  const subjectCount = await Subject.countDocuments({ class: cls._id });
  if (subjectCount > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete class. There are ${subjectCount} subject(s) associated with it. Remove or reassign subjects first.`
    });
  }

  await Class.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Class deleted successfully'
  });
});

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
};
