/**
 * MongoDB Test Data Import Script
 * 
 * This script will create test data for staff, doctors, leave types, leave balances, and leave requests
 * for testing the leave management functionality in the MedClinic application.
 * 
 * Usage: 
 * 1. Make sure MongoDB is running
 * 2. Update the MongoDB connection string if needed
 * 3. Run this script: node import-test-data.js
 */

const { MongoClient, ObjectId } = require('mongodb');

// MongoDB connection string - change if needed
const uri = 'mongodb://localhost:27017/mediclinic';

async function importTestData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data (optional)
    await clearExistingData(db);
    
    // Import staff data
    await importStaffData(db);
    
    // Import doctor data
    await importDoctorData(db);
    
    // Import leave types
    await importLeaveTypes(db);
    
    // Import leave balances
    await importLeaveBalances(db);
    
    // Import leave requests
    await importLeaveRequests(db);
    
    // Import users
    await importUsers(db);
    
    console.log('All test data imported successfully!');
    
  } catch (error) {
    console.error('Error importing data:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

async function clearExistingData(db) {
  console.log('Clearing existing test data...');
  
  // Remove only the test data that we've created (using the specific IDs)
  const testIds = [
    "60d0fe4f5311236168a109ca", "60d0fe4f5311236168a109cb", "60d0fe4f5311236168a109cc",
    "60d0fe4f5311236168a109cd", "60d0fe4f5311236168a109ce", "60d0fe4f5311236168a109cf",
    "60d0fe4f5311236168a109d0", "60d0fe4f5311236168a109d1", "60d0fe4f5311236168a109d2",
    "60d0fe4f5311236168a109d3", "60d0fe4f5311236168a109d4", "60d0fe4f5311236168a109d5",
    "60d0fe4f5311236168a109e0", "60d0fe4f5311236168a109e1", "60d0fe4f5311236168a109e2",
    "60d0fe4f5311236168a109aa", "60d0fe4f5311236168a109ab", "60d0fe4f5311236168a109ac"
  ];
  
  const objectIds = testIds.map(id => new ObjectId(id));
  
  await db.collection('staffs').deleteMany({ _id: { $in: objectIds } });
  await db.collection('doctors').deleteMany({ _id: { $in: objectIds } });
  await db.collection('leavetypes').deleteMany({ _id: { $in: objectIds } });
  await db.collection('leavebalances').deleteMany({ 
    $or: [
      { userId: { $in: objectIds } },
      { leaveTypeId: { $in: objectIds } }
    ]
  });
  await db.collection('leaverequests').deleteMany({ _id: { $in: objectIds } });
  await db.collection('users').deleteMany({ _id: { $in: objectIds } });
}

async function importStaffData(db) {
  console.log('Importing staff data...');
  
  const staffData = [
    {
      _id: new ObjectId("60d0fe4f5311236168a109ca"),
      firstName: "Jane",
      lastName: "Smith",
      email: "jane.smith@mediclinic.com",
      department: "Nursing",
      designation: "Head Nurse",
      status: "active",
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109cb"),
      firstName: "Robert",
      lastName: "Johnson",
      email: "robert.johnson@mediclinic.com",
      department: "Administration",
      designation: "Office Manager",
      status: "active",
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109cc"),
      firstName: "Maria",
      lastName: "Garcia",
      email: "maria.garcia@mediclinic.com",
      department: "Laboratory",
      designation: "Lab Technician",
      status: "active",
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    }
  ];
  
  await db.collection('staffs').insertMany(staffData);
  console.log(`${staffData.length} staff records imported`);
}

async function importDoctorData(db) {
  console.log('Importing doctor data...');
  
  // First create department IDs if needed
  const departmentData = [
    {
      _id: new ObjectId("60d0fe4f5311236168a109d0"),
      name: "Cardiology",
      description: "Heart and cardiovascular system",
      isActive: true,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109d1"),
      name: "Pediatrics",
      description: "Medical care of infants, children, and adolescents",
      isActive: true,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109d2"),
      name: "Orthopedics",
      description: "Musculoskeletal system",
      isActive: true,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    }
  ];
  
  await db.collection('departments').insertMany(departmentData);
  console.log(`${departmentData.length} department records imported`);
  
  const doctorData = [
    {
      _id: new ObjectId("60d0fe4f5311236168a109cd"),
      firstName: "David",
      lastName: "Wilson",
      email: "david.wilson@mediclinic.com",
      departmentId: new ObjectId("60d0fe4f5311236168a109d0"), // Cardiology
      specialization: "Cardiology",
      status: "active",
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109ce"),
      firstName: "Sarah",
      lastName: "Martinez",
      email: "sarah.martinez@mediclinic.com",
      departmentId: new ObjectId("60d0fe4f5311236168a109d1"), // Pediatrics
      specialization: "Pediatrics",
      status: "active",
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109cf"),
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@mediclinic.com",
      departmentId: new ObjectId("60d0fe4f5311236168a109d2"), // Orthopedics
      specialization: "Orthopedics",
      status: "active",
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    }
  ];
  
  await db.collection('doctors').insertMany(doctorData);
  console.log(`${doctorData.length} doctor records imported`);
}

async function importLeaveTypes(db) {
  console.log('Importing leave types...');
  
  const leaveTypeData = [
    {
      _id: new ObjectId("60d0fe4f5311236168a109d3"),
      name: "Annual Leave",
      description: "Regular annual leave entitlement",
      defaultDays: 20,
      color: "#4CAF50", // Green
      isActive: true,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109d4"),
      name: "Sick Leave",
      description: "Leave for illness or medical appointments",
      defaultDays: 10,
      color: "#F44336", // Red
      isActive: true,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109d5"),
      name: "Maternity/Paternity Leave",
      description: "Leave for new parents",
      defaultDays: 30,
      color: "#2196F3", // Blue
      isActive: true,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    }
  ];
  
  await db.collection('leavetypes').insertMany(leaveTypeData);
  console.log(`${leaveTypeData.length} leave type records imported`);
}

async function importLeaveBalances(db) {
  console.log('Importing leave balances...');
  
  const leaveBalanceData = [
    // Staff leave balances
    {
      userId: new ObjectId("60d0fe4f5311236168a109ca"), // Jane Smith
      leaveTypeId: new ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
      year: 2025,
      allocated: 20,
      used: 5,
      pending: 0,
      carried: 0,
      available: 15,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      userId: new ObjectId("60d0fe4f5311236168a109cb"), // Robert Johnson
      leaveTypeId: new ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
      year: 2025,
      allocated: 20,
      used: 10,
      pending: 2,
      carried: 5,
      available: 13,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      userId: new ObjectId("60d0fe4f5311236168a109cc"), // Maria Garcia
      leaveTypeId: new ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
      year: 2025,
      allocated: 10,
      used: 3,
      pending: 0,
      carried: 0,
      available: 7,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    
    // Doctor leave balances
    {
      userId: new ObjectId("60d0fe4f5311236168a109cd"), // David Wilson
      leaveTypeId: new ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
      year: 2025,
      allocated: 25,
      used: 10,
      pending: 0,
      carried: 0,
      available: 15,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      userId: new ObjectId("60d0fe4f5311236168a109ce"), // Sarah Martinez
      leaveTypeId: new ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
      year: 2025,
      allocated: 25,
      used: 5,
      pending: 5,
      carried: 0,
      available: 15,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      userId: new ObjectId("60d0fe4f5311236168a109cf"), // Michael Brown
      leaveTypeId: new ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
      year: 2025,
      allocated: 15,
      used: 2,
      pending: 0,
      carried: 0,
      available: 13,
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    }
  ];
  
  await db.collection('leavebalances').insertMany(leaveBalanceData);
  console.log(`${leaveBalanceData.length} leave balance records imported`);
}

async function importLeaveRequests(db) {
  console.log('Importing leave requests...');
  
  const leaveRequestData = [
    {
      _id: new ObjectId("60d0fe4f5311236168a109e0"),
      staffId: new ObjectId("60d0fe4f5311236168a109ca"), // Jane Smith
      requestedBy: new ObjectId("60d0fe4f5311236168a109aa"), // Admin user
      leaveTypeId: new ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
      startDate: new Date("2025-09-10T00:00:00Z"),
      endDate: new Date("2025-09-15T00:00:00Z"),
      reason: "Family vacation",
      contactDetails: "555-123-4567",
      status: "approved",
      approvedBy: new ObjectId("60d0fe4f5311236168a109aa"), // Admin user
      comments: "Approved as requested",
      createdAt: new Date("2025-08-01T10:30:00Z"),
      updatedAt: new Date("2025-08-02T14:15:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109e1"),
      doctorId: new ObjectId("60d0fe4f5311236168a109cd"), // David Wilson
      requestedBy: new ObjectId("60d0fe4f5311236168a109aa"), // Admin user
      leaveTypeId: new ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
      startDate: new Date("2025-08-20T00:00:00Z"),
      endDate: new Date("2025-08-22T00:00:00Z"),
      reason: "Medical procedure",
      contactDetails: "555-987-6543",
      status: "pending",
      createdAt: new Date("2025-08-10T09:45:00Z"),
      updatedAt: new Date("2025-08-10T09:45:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109e2"),
      staffId: new ObjectId("60d0fe4f5311236168a109cb"), // Robert Johnson
      requestedBy: new ObjectId("60d0fe4f5311236168a109aa"), // Admin user
      leaveTypeId: new ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
      dates: [
        new Date("2025-10-05T00:00:00Z"),
        new Date("2025-10-06T00:00:00Z"),
        new Date("2025-10-07T00:00:00Z")
      ],
      reason: "Personal matters",
      status: "rejected",
      rejectedBy: new ObjectId("60d0fe4f5311236168a109aa"), // Admin user
      comments: "High workload during this period",
      createdAt: new Date("2025-08-15T11:20:00Z"),
      updatedAt: new Date("2025-08-16T16:30:00Z")
    }
  ];
  
  await db.collection('leaverequests').insertMany(leaveRequestData);
  console.log(`${leaveRequestData.length} leave request records imported`);
}

async function importUsers(db) {
  console.log('Importing users...');
  
  const userData = [
    {
      _id: new ObjectId("60d0fe4f5311236168a109aa"),
      username: "admin",
      firstName: "Admin",
      lastName: "User",
      email: "admin@mediclinic.com",
      password: "$2a$12$1InE4YhH6AucZbTT5NCy8.lfBj8ORAsS1.zCM9BrN1QT8SrfJkESa", // hashed password for "password123"
      role: "admin",
      status: "active",
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109ab"),
      username: "manager",
      firstName: "Manager",
      lastName: "User",
      email: "manager@mediclinic.com",
      password: "$2a$12$1InE4YhH6AucZbTT5NCy8.lfBj8ORAsS1.zCM9BrN1QT8SrfJkESa", // hashed password for "password123"
      role: "manager",
      status: "active",
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    },
    {
      _id: new ObjectId("60d0fe4f5311236168a109ac"),
      username: "user",
      firstName: "Regular",
      lastName: "User",
      email: "user@mediclinic.com",
      password: "$2a$12$1InE4YhH6AucZbTT5NCy8.lfBj8ORAsS1.zCM9BrN1QT8SrfJkESa", // hashed password for "password123"
      role: "user",
      status: "active",
      createdAt: new Date("2023-08-28T08:00:00Z"),
      updatedAt: new Date("2023-08-28T08:00:00Z")
    }
  ];
  
  await db.collection('users').insertMany(userData);
  console.log(`${userData.length} user records imported`);
}

// Run the import
importTestData().catch(console.error);
