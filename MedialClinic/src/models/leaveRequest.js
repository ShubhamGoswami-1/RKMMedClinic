import mongoose from 'mongoose';

const leaveRequestSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User who requested the leave is required']
  },
  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveType',
    required: [true, 'Leave type ID is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value >= this.startDate;
      },
      message: 'End date must be after or equal to start date'
    }
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewDate: {
    type: Date
  },
  reviewNotes: {
    type: String,
    trim: true
  },
  attachments: [{
    name: String,
    path: String,
    mimeType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for number of days
leaveRequestSchema.virtual('numberOfDays').get(function() {
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  const timeDiff = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // Include both start and end date
  return diffDays;
});

// Pre-save middleware to update the updatedAt field
leaveRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries by status
leaveRequestSchema.index({ status: 1 });

// Index for efficient queries by date range
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

// Validate that at least one ID is provided (staffId, doctorId, or userId)
leaveRequestSchema.pre('validate', function(next) {
  if (!this.staffId && !this.doctorId && !this.userId) {
    this.invalidate('staffId', 'At least one of staffId, doctorId, or userId must be provided');
  }
  next();
});

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

export default LeaveRequest;
