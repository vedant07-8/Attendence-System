const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/faculty', authorize('faculty'), getFacultyDashboard);
router.get('/student', authorize('student'), getStudentDashboard);

module.exports = router;
