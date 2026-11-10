const mongoose = require('mongoose');
const Student = require('../models/Student');
const asyncHandler = require('../middleware/asyncHandler');

const writableFields = new Set([
  'firstName',
  'lastName',
  'email',
  'dateOfBirth',
  'grade',
  'course'
]);

function readStudentPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    const error = new Error('Request body must be a JSON object');
    error.statusCode = 400;
    throw error;
  }

  const fields = Object.keys(body);
  const unknownFields = fields.filter((field) => !writableFields.has(field));

  if (unknownFields.length > 0) {
    const error = new Error(`Unknown field(s): ${unknownFields.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  if (fields.length === 0) {
    const error = new Error('Provide at least one student field');
    error.statusCode = 400;
    throw error;
  }

  return body;
}

function validateStudentId(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error('Invalid student ID');
    error.statusCode = 400;
    throw error;
  }
}

const listStudents = asyncHandler(async (req, res) => {
  const students = await Student.find().sort({ lastName: 1, firstName: 1 });
  res.json({ data: students, count: students.length });
});

const getStudent = asyncHandler(async (req, res) => {
  validateStudentId(req.params.id);
  const student = await Student.findById(req.params.id);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json({ data: student });
});

const createStudent = asyncHandler(async (req, res) => {
  const payload = readStudentPayload(req.body);
  const student = await Student.create(payload);
  res.status(201).json({ data: student });
});

const updateStudent = asyncHandler(async (req, res) => {
  validateStudentId(req.params.id);
  const payload = readStudentPayload(req.body);
  const student = await Student.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true
  });

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json({ data: student });
});

const deleteStudent = asyncHandler(async (req, res) => {
  validateStudentId(req.params.id);
  const student = await Student.findByIdAndDelete(req.params.id);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.status(204).end();
});

module.exports = {
  createStudent,
  deleteStudent,
  getStudent,
  listStudents,
  updateStudent
};
