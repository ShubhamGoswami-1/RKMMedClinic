/**
 * Updated email templates with consistent UI theme
 * Run this script to update the database with new email templates
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmailTemplate from '../src/models/templates.js';
import { EMAIL_TEMPLATES } from '../utils/constants.js';

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

// Define theme colors
const THEME = {
  primary: '#f97316', // orange-500
  secondary: '#f59e0b', // amber-500
  accent: '#3b82f6', // blue-500
  success: '#22c55e', // green-500
  danger: '#ef4444', // red-500
  background: '#fff7ed', // orange-50
  text: '#1f2937', // gray-800
  lightText: '#6b7280', // gray-500
};

// Updated email templates data with consistent branding
const templates = [
  {
    templateId: EMAIL_TEMPLATES.USER_SIGNUP_PENDING_APPROVAL,
    subject: 'RKM MedClinic: New User Registration Requires Approval',
    content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New User Registration</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${THEME.text};
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(to right, ${THEME.primary}, ${THEME.secondary});
            padding: 20px;
            color: white;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .user-info {
            background-color: ${THEME.background};
            border-left: 4px solid ${THEME.primary};
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }          .button {
            display: inline-block;
            padding: 12px 24px;
            font-weight: bold;
            text-decoration: none;
            border-radius: 6px;
            margin: 0 10px;
            color: white !important; /* Ensuring white text color */
          }
          .approve-button {
            background-color: ${THEME.success};
            color: white !important; /* Force white text color */
          }
          .reject-button {
            background-color: ${THEME.danger};
            color: white !important; /* Force white text color */
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
            color: ${THEME.lightText};
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RKM Medical Centre</h1>
            <p>Professional Healthcare Management</p>
          </div>
          <div class="content">            <h2>New User Registration Pending Approval</h2>
            <p>Hello,</p>
            <p>A new user has registered on the RKM MediClinic platform and requires your approval:</p>
              <div class="user-info">
              <p><strong>Name:</strong> {{fullName}}</p>
              <p><strong>Username:</strong> {{username}}</p>
              <p><strong>Email:</strong> {{email}}</p>
              <p><strong>Role:</strong> {{role}}</p>
              <p><strong>Registration Date:</strong> {{date}}</p>
            </div>
            
            <p>Please review this registration and take appropriate action:</p>
            
            <div class="button-container">
              <a href="{{approveUrl}}" class="button approve-button">Approve User</a>
              <a href="{{rejectUrl}}" class="button reject-button">Reject User</a>
            </div>
            
            <p>Thank you for maintaining the security of our platform.</p>
            
            <p>Best regards,<br>RKM MediClinic Administration</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 RKM Medical Centre. All rights reserved.</p>
            <p>Professional healthcare management solution</p>
          </div>
        </div>
      </body>
      </html>
    `,
    description: 'Email sent to admin when a new user registers and needs approval',
    active: true
  },
  {
    templateId: EMAIL_TEMPLATES.USER_APPROVED,
    subject: 'RKM MediClinic: Your Account has been Approved',
    content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${THEME.text};
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(to right, ${THEME.primary}, ${THEME.secondary});
            padding: 20px;
            color: white;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .info-box {
            background-color: ${THEME.background};
            border-left: 4px solid ${THEME.success};
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: ${THEME.accent};
            color: white !important; /* Force white text color */
            font-weight: bold;
            text-decoration: none;
            border-radius: 6px;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
            color: ${THEME.lightText};
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RKM Medical Centre</h1>
            <p>Professional Healthcare Management</p>
          </div>
          <div class="content">
            <h2>Account Approved</h2>
            <p>Dear {{username}},</p>
              <div class="info-box">
              <p>We're pleased to inform you that your RKM MediClinic account has been approved.</p>
              <p>You can now log in to the platform and start using all the features available to your role.</p>
            </div>
            
            <div class="button-container">
              <a href="{{loginUrl}}" class="button">Login Now</a>
            </div>
            
            <p>If you have any questions or need assistance, please contact our support team.</p>
            
            <p>Welcome aboard!</p>
            <p>Best regards,<br>RKM MediClinic Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 RKM Medical Centre. All rights reserved.</p>
            <p>Professional healthcare management solution</p>
          </div>
        </div>
      </body>
      </html>
    `,
    description: 'Email sent to user when their account is approved',
    active: true
  },
  {
    templateId: EMAIL_TEMPLATES.USER_REJECTED,
    subject: 'RKM MediClinic: Account Registration Status',
    content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Registration Update</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${THEME.text};
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(to right, ${THEME.primary}, ${THEME.secondary});
            padding: 20px;
            color: white;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .info-box {
            background-color: #fef2f2;
            border-left: 4px solid ${THEME.danger};
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
          }
          .reasons-list {
            background-color: ${THEME.background};
            padding: 15px;
            border-radius: 4px;
          }
          .reasons-list li {
            margin-bottom: 8px;
          }
          .footer {
            text-align: center;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
            color: ${THEME.lightText};
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>RKM Medical Centre</h1>
            <p>Professional Healthcare Management</p>
          </div>
          <div class="content">
            <h2>Account Registration Update</h2>
            <p>Dear {{username}},</p>
              <div class="info-box">
              <p>We regret to inform you that your registration request for a RKM MediClinic account has not been approved at this time.</p>
            </div>
            
            <p>This may be due to one of the following reasons:</p>
            
            <ul class="reasons-list">
              <li>Incomplete or incorrect information provided</li>
              <li>Unable to verify your credentials</li>
              <li>The role requested requires additional verification</li>
            </ul>
            
            <p>If you believe this is an error or would like to provide additional information, please contact our administration team.</p>
            
            <p>Thank you for your understanding.</p>
            <p>Best regards,<br>RKM MediClinic Administration</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 RKM Medical Centre. All rights reserved.</p>
            <p>Professional healthcare management solution</p>
          </div>
        </div>
      </body>
      </html>
    `,
    description: 'Email sent to user when their account is rejected',
    active: true  }
];

// Add Leave Management Templates
const leaveManagementTemplates = [
  {
    templateId: EMAIL_TEMPLATES.LEAVE_REQUEST_NOTIFICATION,
    subject: 'RKM MediClinic: New Leave Request Requires Approval',
    content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Leave Request</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${THEME.text};
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(to right, ${THEME.primary}, ${THEME.secondary});
            padding: 20px;
            color: white;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .leave-details {
            background-color: ${THEME.background};
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid ${THEME.primary};
          }
          .button {
            display: inline-block;
            background-color: ${THEME.accent};
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
            font-weight: bold;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: ${THEME.lightText};
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
          }
          .actions {
            text-align: center;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Leave Request</h1>
          </div>
          <div class="content">
            <p>A new leave request has been submitted and requires your review:</p>
            
            <div class="leave-details">
              <p><strong>Employee:</strong> {{userName}}</p>
              <p><strong>Leave Type:</strong> {{leaveType}}</p>
              <p><strong>Duration:</strong> {{dateInfo}}</p>
              <p><strong>Reason:</strong> {{reason}}</p>
            </div>
            
            <p>Please review this request and take appropriate action.</p>
            
            <div class="actions">
              <a href="{{adminActionUrl}}" class="button">Review Leave Requests</a>
            </div>
            
            <p>Thank you for your prompt attention to this matter.</p>
            <p>Best regards,<br>RKM MediClinic HR Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 RKM Medical Centre. All rights reserved.</p>
            <p>Professional healthcare management solution</p>
          </div>
        </div>
      </body>
      </html>
    `,
    description: 'Email notification sent to admins when a new leave request is submitted',
    active: true
  },
  {
    templateId: EMAIL_TEMPLATES.LEAVE_APPROVED,
    subject: 'RKM MediClinic: Your Leave Request Has Been Approved',
    content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Leave Request Approved</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${THEME.text};
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(to right, ${THEME.success}, #0d9488);
            padding: 20px;
            color: white;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .leave-details {
            background-color: #f0fdf4;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid ${THEME.success};
          }
          .button {
            display: inline-block;
            background-color: ${THEME.accent};
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
            font-weight: bold;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: ${THEME.lightText};
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
          }
          .status {
            display: inline-block;
            background-color: ${THEME.success};
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 10px;
          }
          .actions {
            text-align: center;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Leave Request Approved</h1>
          </div>
          <div class="content">
            <p>Dear {{userName}},</p>
            
            <p>We're pleased to inform you that your leave request has been <span class="status">Approved</span></p>
            
            <div class="leave-details">
              <p><strong>Leave Type:</strong> {{leaveType}}</p>
              <p><strong>Duration:</strong> {{dateInfo}}</p>
              <p><strong>Reason:</strong> {{reason}}</p>
              <p><strong>Approved By:</strong> {{approvedBy}}</p>
              {{#if comments}}<p><strong>Comments:</strong> {{comments}}</p>{{/if}}
            </div>
            
            <p>You can view all your leave requests and balances by visiting the Leave Management section in your dashboard.</p>
            
            <div class="actions">
              <a href="{{viewDetailsUrl}}" class="button">View Leave Details</a>
            </div>
            
            <p>If you have any questions, please contact the HR department.</p>
            <p>Best regards,<br>RKM MediClinic HR Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 RKM Medical Centre. All rights reserved.</p>
            <p>Professional healthcare management solution</p>
          </div>
        </div>
      </body>
      </html>
    `,
    description: 'Email sent to employees when their leave request is approved',
    active: true
  },
  {
    templateId: EMAIL_TEMPLATES.LEAVE_REJECTED,
    subject: 'RKM MediClinic: Your Leave Request Has Been Declined',
    content: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Leave Request Declined</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${THEME.text};
            background-color: #f9fafb;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(to right, ${THEME.danger}, #dc2626);
            padding: 20px;
            color: white;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            text-align: center;
          }
          .content {
            padding: 20px;
          }
          .leave-details {
            background-color: #fef2f2;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid ${THEME.danger};
          }
          .button {
            display: inline-block;
            background-color: ${THEME.accent};
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 5px;
            margin-top: 15px;
            font-weight: bold;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .footer {
            text-align: center;
            padding: 20px;
            color: ${THEME.lightText};
            font-size: 12px;
            border-top: 1px solid #e5e7eb;
            margin-top: 20px;
          }
          .status {
            display: inline-block;
            background-color: ${THEME.danger};
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 14px;
            margin-top: 10px;
          }
          .actions {
            text-align: center;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Leave Request Declined</h1>
          </div>
          <div class="content">
            <p>Dear {{userName}},</p>
            
            <p>We regret to inform you that your leave request has been <span class="status">Declined</span></p>
            
            <div class="leave-details">
              <p><strong>Leave Type:</strong> {{leaveType}}</p>
              <p><strong>Duration:</strong> {{dateInfo}}</p>
              <p><strong>Reason:</strong> {{reason}}</p>
              <p><strong>Declined By:</strong> {{rejectedBy}}</p>
              <p><strong>Reason for Decline:</strong> {{comments}}</p>
            </div>
            
            <p>If you have any questions regarding this decision, please contact your manager or the HR department.</p>
            
            <p>You can view all your leave requests and balances by visiting the Leave Management section in your dashboard.</p>
            
            <div class="actions">
              <a href="{{viewDetailsUrl}}" class="button">View Leave Details</a>
            </div>
            
            <p>Best regards,<br>RKM MediClinic HR Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 RKM Medical Centre. All rights reserved.</p>
            <p>Professional healthcare management solution</p>
          </div>
        </div>
      </body>
      </html>
    `,
    description: 'Email sent to employees when their leave request is rejected',
    active: true
  }
];

// Add leave management templates to the main templates array
templates.push(...leaveManagementTemplates);

// Update templates in the database
const updateTemplates = async () => {
  try {
    console.log('Updating email templates...');
    
    // Process each template
    for (const template of templates) {
      // Find and update or create new
      await EmailTemplate.findOneAndUpdate(
        { templateId: template.templateId },
        template,
        { upsert: true, new: true }
      );
      
      console.log(`Template "${template.templateId}" updated successfully.`);
    }
    
    console.log('All email templates updated successfully!');
    process.exit();
  } catch (err) {
    console.error('Error updating template data:', err);
    process.exit(1);
  }
};

// Run the update
updateTemplates();
