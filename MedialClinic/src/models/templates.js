import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      required: [true, 'Please provide a unique template ID'],
      unique: true,
      trim: true,
      match: [/^[a-zA-Z0-9_]+$/, 'Template ID can only contain letters, numbers, and underscores'],
    },
    subject: {
      type: String,
      required: [true, 'Please provide the email subject'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Please provide the email content'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    collection: 'emailTemplate',
    versionKey: false,
  }
);

const EmailTemplate = mongoose.model('emailTemplate', emailTemplateSchema);
export default EmailTemplate;