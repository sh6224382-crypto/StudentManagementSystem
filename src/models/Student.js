const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: (date) => !date || date < new Date(),
        message: 'Date of birth must be in the past'
      }
    },
    grade: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40
    },
    course: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
