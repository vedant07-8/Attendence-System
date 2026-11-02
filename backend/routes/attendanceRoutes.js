const express = require('express');
const router = express.Router();
const {
  getAttendanceSheet,
  markAttendance,
  getAttendanceHistory,
  getStudentAttendance
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.get('/sheet', authorize('admin', 'faculty'), getAttendanceSheet);
router.post('/mark', authorize('admin', 'faculty'), markAttendance);
router.get('/history', authorize('admin', 'faculty'), getAttendanceHistory);
router.get('/student/:studentId', getStudentAttendance);

module.exports = router;
