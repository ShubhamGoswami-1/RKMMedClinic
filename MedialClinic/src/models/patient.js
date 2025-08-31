import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: [true, 'Gender is required']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
  },
  address: {
    type: String,
    trim: true
  },  identifiers: {
    aadhar: {
      type: String,
      trim: true,
      // Remove sparse: true since we're using explicit index definition below
    },
    pan: {
      type: String,
      trim: true,
      // Remove sparse: true since we're using explicit index definition below
    },
    other: {
      type: String,
      trim: true
    }
  },
  medicalHistory: {
    type: String,
    trim: true
  },
  allergies: [{
    type: String,
    trim: true
  }],
  bloodGroup: {
    type: String,
    trim: true
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient searching
patientSchema.index({ phone: 1 });
patientSchema.index({ 'identifiers.aadhar': 1 }, { sparse: true }); // Using sparse option here
patientSchema.index({ 'identifiers.pan': 1 }, { sparse: true }); // Using sparse option here
patientSchema.index({ firstName: 'text', lastName: 'text' });

// Pre-save middleware to update the updatedAt field
patientSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Patient = mongoose.model('Patient', patientSchema);

export default Patient;
