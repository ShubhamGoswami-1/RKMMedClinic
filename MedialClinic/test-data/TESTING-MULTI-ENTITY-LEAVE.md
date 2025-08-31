# Testing the Multi-Entity Leave Request Feature

This guide explains how to test the new multi-entity leave request functionality using the provided test data.

## Overview

The updated leave request system now allows applying for leave for:
- Yourself (the logged-in user)
- Staff members
- Doctors

## Prerequisites

1. Make sure MongoDB is running
2. Ensure both backend and frontend applications are running
3. Import the test data

## Importing Test Data

Run the following commands in your terminal to import the comprehensive test data:

```
cd c:\Users\shubham.goswami1\OneDrive - Incedo Technology Solutions Ltd\Documents\Dev\Mediclinic\RKMMedClinicCombined\MedialClinic\test-data
node import-comprehensive-data.js
```

## Test Scenarios

### 1. Apply Leave for a Staff Member

1. Log in as an admin user (username: `admin`, password: `password123`)
2. Navigate to the Leave Management section
3. Click "Apply for Leave"
4. In the Leave Request Form:
   - Select "Staff" as the entity type
   - Choose a staff member from the dropdown (e.g., "Jane Smith")
   - Select a leave type (e.g., "Annual Leave")
   - Choose dates
   - Enter a reason
   - Submit the request
5. Verify the request appears in the leave requests list

### 2. Apply Leave for a Doctor

1. Log in as an admin user
2. Navigate to the Leave Management section
3. Click "Apply for Leave"
4. In the Leave Request Form:
   - Select "Doctor" as the entity type
   - Choose a doctor from the dropdown (e.g., "David Wilson")
   - Select a leave type (e.g., "Sick Leave")
   - Choose dates
   - Enter a reason
   - Submit the request
5. Verify the request appears in the leave requests list

### 3. View Leave Requests by Entity Type

1. Log in as an admin user
2. Navigate to the Leave Management section
3. Click "Manage Leave Requests"
4. Use the entity type selector to switch between:
   - Your requests
   - Staff requests
   - Doctor requests
5. Verify that the appropriate requests are displayed for each entity type

### 4. Approve/Reject Leave Requests

1. Log in as an admin user
2. Navigate to the Leave Management section
3. Click "Manage Leave Requests"
4. Select an entity type and find a pending request
5. Click the "Approve" or "Reject" button
6. Provide a comment if rejecting
7. Verify the request status changes accordingly

## Test Data Summary

### Users
- Admin User (admin@mediclinic.com)
- Manager User (manager@mediclinic.com)
- Regular User (user@mediclinic.com)
- HR Admin (hr@mediclinic.com)

### Staff Members
- Jane Smith (Head Nurse)
- Robert Johnson (Office Manager)
- Maria Garcia (Lab Technician)
- Thomas Chen (Pharmacist)
- Lisa Wong (Radiologist Assistant)

### Doctors
- David Wilson (Cardiology)
- Sarah Martinez (Pediatrics)
- Michael Brown (Orthopedics)
- Emma Lee (Dermatology)
- James Taylor (Neurology)

### Leave Types
- Annual Leave
- Sick Leave
- Maternity/Paternity Leave
- Study Leave
- Compassionate Leave

## Troubleshooting

- If the entity dropdown is empty, verify that the test data was imported correctly
- Check the browser console for any errors
- Ensure that both the backend and frontend services are running
- Verify that the MongoDB connection is established
