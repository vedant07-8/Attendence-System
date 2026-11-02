const express = require('express');
const router = express.Router();
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass
} = require('../controllers/classController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.route('/')
  .get(getClasses)
  .post(authorize('admin'), createClass);

router.route('/:id')
  .get(getClassById)
  .put(authorize('admin'), updateClass)
  .delete(authorize('admin'), deleteClass);

module.exports = router;
