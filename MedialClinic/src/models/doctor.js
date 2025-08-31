import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Legacy field
  },
  linkedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department ID is required']
  },
  qualifications: [{
    type: String,
    trim: true
  }],
  specializations: [{
    type: String,
    trim: true
  }],
  experience: {
    type: Number, // In years
    default: 0
  },
  consultationFee: {
    type: Number,
    required: [true, 'Consultation fee is required'],
    default: 0
  },
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
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

// Pre-save middleware to update the updatedAt field
doctorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
