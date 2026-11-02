const express = require('express');
const router = express.Router();
const {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getMyAssignments
} = require('../controllers/facultyController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

router.use(protect);

router.get('/me/assigned', authorize('faculty'), getMyAssignments);

router.route('/')
  .get(authorize('admin', 'faculty'), getFaculty)
  .post(authorize('admin'), createFaculty);

router.route('/:id')
  .get(getFacultyById)
  .put(authorize('admin'), updateFaculty)
  .delete(authorize('admin'), deleteFaculty);

module.exports = router;
