/**
 * Seed data for email templates
 * Run this script to populate the database with initial email templates
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmailTemplate from '../models/templates.js';
import { EMAIL_TEMPLATES } from '../../utils/constants.js';

// Load environment variables - try multiple paths to find the .env file
dotenv.config({ path: '../../.env' });

// Check if DATABASE exists in environment
if (!process.env.DATABASE) {
  console.error('Error: DATABASE environment variable is missing in .env file');
  console.log('Please make sure your .env file contains the DATABASE variable with your MongoDB connection string');
  console.log('Example: DATABASE=mongodb+srv://username:<PASSWORD>@cluster.mongodb.net/medical-clinic');
  process.exit(1);
}

// Check if DATABASE_PASSWORD exists
if (!process.env.DATABASE_PASSWORD) {
  console.error('Error: DATABASE_PASSWORD environment variable is missing in .env file');
  console.log('Please make sure your .env file contains the DATABASE_PASSWORD variable');
  process.exit(1);
}

// Set up database connection
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

// Connect to MongoDB
mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful!'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Email templates data
const templates = [
  {
    templateId: EMAIL_TEMPLATES.USER_SIGNUP_PENDING_APPROVAL,
    subject: 'New User Registration Requires Approval',
    content: `
      <h1>New User Registration Pending Approval</h1>
      <p>A new user has registered on the Medical Clinic platform and requires your approval:</p>
      <div style="margin: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; background-color: #f9f9f9;">
        <p><strong>Username:</strong> {{username}}</p>
        <p><strong>Role:</strong> {{role}}</p>
        <p><strong>Date:</strong> {{date}}</p>
      </div>      <p>Please review this registration and take appropriate action:</p>
      <div style="margin: 20px 0;">
        <a href="{{approveUrl}}" style="padding: 10px 20px; background-color: #4CAF50; color: white !important; text-decoration: none; border-radius: 5px; margin-right: 10px;">Approve User</a>
        <a href="{{rejectUrl}}" style="padding: 10px 20px; background-color: #f44336; color: white !important; text-decoration: none; border-radius: 5px;">Reject User</a>
      </div>
      <p>Thank you for maintaining the security of our platform.</p>
      <p>Medical Clinic Administration</p>
    `,
    description: 'Email sent to admin when a new user registers and needs approval',
    active: true
  },
  {
    templateId: EMAIL_TEMPLATES.USER_APPROVED,
    subject: 'Your Medical Clinic Account has been Approved',
    content: `
      <h1>Account Approved</h1>
      <p>Dear {{username}},</p>
      <p>We're pleased to inform you that your Medical Clinic account has been approved by an administrator.</p>      <p>You can now log in to the platform and start using all the features available to your role.</p>
      <div style="margin: 20px 0;">
        <a href="{{loginUrl}}" style="padding: 10px 20px; background-color: #4CAF50; color: white !important; text-decoration: none; border-radius: 5px;">Login Now</a>
      </div>
      <p>If you have any questions or need assistance, please contact our support team.</p>
      <p>Welcome aboard!</p>
      <p>Medical Clinic Team</p>
    `,
    description: 'Email sent to user when their account is approved',
    active: true
  },
  {
    templateId: EMAIL_TEMPLATES.USER_REJECTED,
    subject: 'Your Medical Clinic Account Registration Status',
    content: `
      <h1>Account Registration Update</h1>
      <p>Dear {{username}},</p>
      <p>We regret to inform you that your registration request for a Medical Clinic account has not been approved at this time.</p>
      <p>This may be due to one of the following reasons:</p>
      <ul>
        <li>Incomplete or incorrect information provided</li>
        <li>Unable to verify your credentials</li>
        <li>The role requested requires additional verification</li>
      </ul>
      <p>If you believe this is an error or would like to provide additional information, please contact our administration team.</p>
      <p>Thank you for your understanding.</p>
      <p>Medical Clinic Administration</p>
    `,
    description: 'Email sent to user when their account is rejected',
    active: true
  }
];

// Insert templates into database
const importData = async () => {
  try {
    // Clear existing templates
    await EmailTemplate.deleteMany({});
    
    // Insert new templates
    await EmailTemplate.insertMany(templates);
    
    console.log('Email templates data successfully loaded!');
    process.exit();
  } catch (err) {
    console.error('Error loading template data:', err);
    process.exit(1);
  }
};

// Run the import
importData();
