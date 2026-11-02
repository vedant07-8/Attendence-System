const express = require('express');
const router = express.Router();
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  assignFaculty,
  deleteSubject
} = require('../controllers/subjectController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.route('/')
  .get(getSubjects)
  .post(authorize('admin'), createSubject);

router.route('/:id')
  .get(getSubjectById)
  .put(authorize('admin'), updateSubject)
  .delete(authorize('admin'), deleteSubject);

router.put('/:id/assign-faculty', authorize('admin'), assignFaculty);

module.exports = router;
