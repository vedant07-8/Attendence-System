const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email and password'
    });
  }

  // Find user and include password field
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Account has been deactivated. Please contact an administrator.'
    });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  // Attach associated profile details (student or faculty)
  let profile = null;
  if (user.role === 'student') {
    profile = await Student.findOne({ user: user._id }).populate('class');
  } else if (user.role === 'faculty') {
    profile = await Faculty.findOne({ user: user._id });
  }

  const token = generateToken(user._id, user.role);

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  let profile = null;

  if (user.role === 'student') {
    profile = await Student.findOne({ user: user._id }).populate('class');
  } else if (user.role === 'faculty') {
    profile = await Faculty.findOne({ user: user._id });
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profile
    }
  });
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both current and new password'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.matchPassword(currentPassword);

  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password does not match'
    });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
});

module.exports = {
  login,
  getMe,
  updatePassword
};
