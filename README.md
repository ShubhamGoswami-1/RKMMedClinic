# Medical Clinic Management System

A comprehensive platform for managing medical clinic operations including user registration, approval, and patient management.

## Project Structure

The project consists of two main parts:
- **Backend API (MedialClinic)**: A Node.js/Express server with MongoDB
- **Frontend (MedicalClinicFrontend)**: React application with TypeScript and Redux

## Features

- User registration with approval workflow
- Role-based access control (Admin, Doctor, Staff)
- Email notifications for registration and approvals
- Secure authentication with JWT

## Getting Started

### Prerequisites

- Node.js 16+
- MongoDB
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```powershell
   cd MedialClinic
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Create a `.env` file (sample provided in the repo)

4. Seed the database with email templates:
   ```powershell
   npm run seed:templates
   ```

5. Start the development server:
   ```powershell
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```powershell
   cd MedicalClinicFrontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the development server:
   ```powershell
   npm run dev
   ```

## User Registration Workflow

1. User signs up with username, email, password and role
2. Account is created with "pending" status
3. Admins receive email notification with approval/rejection links
4. Admin clicks appropriate link and logs in if needed
5. User status is updated (approved/rejected)
6. User receives email notification about the decision
7. Approved users can log in

## API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/signup`: Register a new user
- `POST /api/v1/auth/login`: Authenticate a user
- `POST /api/v1/auth/approve`: Approve a user (admin only)
- `POST /api/v1/auth/reject`: Reject a user (admin only)
- `POST /api/v1/auth/approve-with-token`: Approve a user via email link
- `POST /api/v1/auth/reject-with-token`: Reject a user via email link

## Environment Variables

### Backend

- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port
- `DATABASE_URL`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: JWT token expiration time
- `EMAIL_FROM`: Sender email address
- `EMAIL_HOST`: SMTP server host
- `EMAIL_PORT`: SMTP server port
- `EMAIL_USERNAME`: SMTP username
- `EMAIL_PASSWORD`: SMTP password
- `FRONTEND_URL`: URL of the frontend application
