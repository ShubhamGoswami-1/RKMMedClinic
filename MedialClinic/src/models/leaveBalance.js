import mongoose from 'mongoose';

const leaveBalanceSchema = new mongoose.Schema({
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
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 2020,
    max: 2100
  },
  balances: [{
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveType',
      required: [true, 'Leave type ID is required']
    },
    allocated: {
      type: Number,
      default: 0,
      min: 0
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    },
    pending: {
      type: Number,
      default: 0,
      min: 0
    },
    carryForward: {
      type: Number,
      default: 0,
      min: 0
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

// Index for efficient queries by year and entity type
leaveBalanceSchema.index({ staffId: 1, year: 1 }, { unique: true, sparse: true });
leaveBalanceSchema.index({ doctorId: 1, year: 1 }, { unique: true, sparse: true });
leaveBalanceSchema.index({ userId: 1, year: 1 }, { unique: true, sparse: true });

// Validate that at least one ID is provided
leaveBalanceSchema.pre('validate', function(next) {
  if (!this.staffId && !this.doctorId && !this.userId) {
    this.invalidate('staffId', 'At least one of staffId, doctorId, or userId must be provided');
  }
  next();
});

// Virtual for available balance
leaveBalanceSchema.virtual('balances.available').get(function() {
  return this.allocated + this.carryForward - this.used - this.pending;
});

// Pre-save middleware to update the updatedAt field
leaveBalanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const LeaveBalance = mongoose.model('LeaveBalance', leaveBalanceSchema);

export default LeaveBalance;
