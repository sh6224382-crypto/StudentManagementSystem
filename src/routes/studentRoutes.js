const express = require('express');
const {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent
} = require('../controllers/studentController');

const router = express.Router();

router.route('/').get(listStudents).post(createStudent);
router.route('/:id').get(getStudent).put(updateStudent).patch(updateStudent).delete(deleteStudent);

module.exports = router;
