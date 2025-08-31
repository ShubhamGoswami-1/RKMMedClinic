import mongoose from 'mongoose';

const medicalServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Service name is required'],
    unique: true,
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Service code is required'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department ID is required']
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: 0
  },
  isTest: {
    type: Boolean,
    default: false
  },
  isProcedure: {
    type: Boolean,
    default: false
  },
  isExternalService: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by user ID is required']
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

// Create text index for searching services
medicalServiceSchema.index({ name: 'text', description: 'text', code: 'text' });

// Pre-save middleware to update the updatedAt field
medicalServiceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MedicalService = mongoose.model('MedicalService', medicalServiceSchema);

export default MedicalService;
