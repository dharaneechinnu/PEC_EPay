// models/scholarshipModel.js
const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema(
  {
  scholarshipName: {
      type: String,
      required: true,
      trim: true,
      },
      providerName: {
      type: String,
      required: true,
      trim: true,
      },
      description: {
      type: String,
      required: true,
      },
      eligibilityCriteria: {
      tenthMarks: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
      },
      twelfthMarks: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
      },
      collegeCGPA: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
      },
      maxParentIncome: {
      type: Number,
      default: null,
      },
      womenPreference: {
      type: Boolean,
      default: false,
      },
      academicPerformance: {
      type: String,

      default: "Any",
      },
      disabilityAllowed: {
      type: [String],
      enum: [
      "None",
      "Physical Disability",
      "Visual Impairment",
      "Hearing Impairment",
      "Learning / Other Disability",
      ],
      default: ["None"],
      },
      extracurricular: {
      type: [String],
      enum: [
      "Sports & Fitness",
      "Technical & Innovation",
      "Academic & Research Activities",
      "Leadership & Volunteering",
      "Entrepreneurship & Startups",
      ],
      default: [],
      },
      firstGenGraduate: {
      type: Boolean,
      default: false,
      },
      specialCategory: {
      type: [String], // ["Single Parent", "Orphan"]
      default: [],
      },
      },
      applicationDeadline: {
      type: Date,
      required: true,
      },
      scholarshipAmount: {
      type: Number,
      required: true,
      },

    // ✅ Link to Donor (Who created it)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donor',
      required: true,
    },

    // // ✅ Applied Students
    // applicants: [
    //   {
    //     studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'UsersLogins' },
    //     status: {
    //       type: String,
    //       enum: ['pending', 'verified', 'approved', 'funded', 'rejected'],
    //       default: 'pending',
    //     },
    //     appliedAt: { type: Date, default: Date.now },
    //   },
    // ],

  
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


const Scholarship = mongoose.model('Scholarship', scholarshipSchema);
module.exports = Scholarship;
