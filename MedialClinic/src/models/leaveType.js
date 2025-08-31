import mongoose from 'mongoose';

const leaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Leave type name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  defaultDays: {
    type: Number,
    default: 0,
    min: 0
  },
  color: {
    type: String,
    default: '#3498db'
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

// Pre-save middleware to update the updatedAt field
leaveTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const LeaveType = mongoose.model('LeaveType', leaveTypeSchema);

export default LeaveType;
