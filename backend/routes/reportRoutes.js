const express = require('express');
const router = express.Router();
const {
  getDefaultersReport,
  getMonthlyReport
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.get('/defaulters', authorize('admin', 'faculty'), getDefaultersReport);
router.get('/monthly', authorize('admin', 'faculty'), getMonthlyReport);

module.exports = router;
