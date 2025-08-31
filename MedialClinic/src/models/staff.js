import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: props => `${props.value} is not a valid email!`
    }
  },
  phone: {
    type: String,
    required: false,
    trim: true
  },
  designation: {
    type: String,
    required: false,
    trim: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: false,
  },
  joinDate: {
    type: Date,
    required: [true, 'Join date is required']
  },
  address: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'on-leave', 'terminated'],
    default: 'active'
  },
  linkedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
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

// Virtual for full name
staffSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Pre-save middleware to update the updatedAt field
staffSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries by name
staffSchema.index({ firstName: 1, lastName: 1 });

// Index for efficient queries by department
staffSchema.index({ department: 1 });

// Index for efficient queries by status
staffSchema.index({ status: 1 });

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
