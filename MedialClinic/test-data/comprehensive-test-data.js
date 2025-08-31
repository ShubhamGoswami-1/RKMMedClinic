/**
 * Comprehensive Test Data for Leave Management
 * This file contains a more complete set of test data for all entity types (users, staff, doctors)
 * with various leave request scenarios.
 */

// -------------------------------------------------------------
// STAFF DATA (5 records with different departments)
// -------------------------------------------------------------
db.staffs.insertMany([
  {
    _id: ObjectId("60d0fe4f5311236168a109ca"),
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@mediclinic.com",
    department: "Nursing",
    designation: "Head Nurse",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109cb"),
    firstName: "Robert",
    lastName: "Johnson",
    email: "robert.johnson@mediclinic.com",
    department: "Administration",
    designation: "Office Manager",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109cc"),
    firstName: "Maria",
    lastName: "Garcia",
    email: "maria.garcia@mediclinic.com",
    department: "Laboratory",
    designation: "Lab Technician",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("61d0fe4f5311236168a109f1"),
    firstName: "Thomas",
    lastName: "Chen",
    email: "thomas.chen@mediclinic.com",
    department: "Pharmacy",
    designation: "Pharmacist",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("61d0fe4f5311236168a109f2"),
    firstName: "Lisa",
    lastName: "Wong",
    email: "lisa.wong@mediclinic.com",
    department: "Radiology",
    designation: "Radiologist Assistant",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  }
]);

// -------------------------------------------------------------
// DOCTOR DATA (5 records with different specializations)
// -------------------------------------------------------------
db.doctors.insertMany([
  {
    _id: ObjectId("60d0fe4f5311236168a109cd"),
    firstName: "David",
    lastName: "Wilson",
    email: "david.wilson@mediclinic.com",
    departmentId: ObjectId("60d0fe4f5311236168a109d0"), // Cardiology department
    specialization: "Cardiology",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109ce"),
    firstName: "Sarah",
    lastName: "Martinez",
    email: "sarah.martinez@mediclinic.com",
    departmentId: ObjectId("60d0fe4f5311236168a109d1"), // Pediatrics department
    specialization: "Pediatrics",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109cf"),
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@mediclinic.com",
    departmentId: ObjectId("60d0fe4f5311236168a109d2"), // Orthopedics department
    specialization: "Orthopedics",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("61d0fe4f5311236168a109f3"),
    firstName: "Emma",
    lastName: "Lee",
    email: "emma.lee@mediclinic.com",
    departmentId: ObjectId("61d0fe4f5311236168a109f9"), // Dermatology department
    specialization: "Dermatology",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("61d0fe4f5311236168a109f4"),
    firstName: "James",
    lastName: "Taylor",
    email: "james.taylor@mediclinic.com",
    departmentId: ObjectId("61d0fe4f5311236168a109fa"), // Neurology department
    specialization: "Neurology",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  }
]);

// -------------------------------------------------------------
// DEPARTMENTS (For doctors)
// -------------------------------------------------------------
db.departments.insertMany([
  {
    _id: ObjectId("60d0fe4f5311236168a109d0"),
    name: "Cardiology",
    description: "Heart and cardiovascular system",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109d1"),
    name: "Pediatrics",
    description: "Medical care for infants, children, and adolescents",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109d2"),
    name: "Orthopedics",
    description: "Musculoskeletal system",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("61d0fe4f5311236168a109f9"),
    name: "Dermatology",
    description: "Skin, hair, nails, and related disorders",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("61d0fe4f5311236168a109fa"),
    name: "Neurology",
    description: "Disorders of the nervous system",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  }
]);

// -------------------------------------------------------------
// LEAVE TYPES (5 records)
// -------------------------------------------------------------
db.leavetypes.insertMany([
  {
    _id: ObjectId("60d0fe4f5311236168a109d3"),
    name: "Annual Leave",
    description: "Regular annual leave entitlement",
    defaultDays: 20,
    color: "#4CAF50", // Green
    isActive: true,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109d4"),
    name: "Sick Leave",
    description: "Leave for illness or medical appointments",
    defaultDays: 10,
    color: "#F44336", // Red
    isActive: true,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109d5"),
    name: "Maternity/Paternity Leave",
    description: "Leave for new parents",
    defaultDays: 30,
    color: "#2196F3", // Blue
    isActive: true,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("61d0fe4f5311236168a109fb"),
    name: "Study Leave",
    description: "Leave for educational purposes",
    defaultDays: 5,
    color: "#9C27B0", // Purple
    isActive: true,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("61d0fe4f5311236168a109fc"),
    name: "Compassionate Leave",
    description: "Leave for family emergencies or bereavement",
    defaultDays: 5,
    color: "#FF9800", // Orange
    isActive: true,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  }
]);

// -------------------------------------------------------------
// USER DATA (for testing admin/manager roles)
// -------------------------------------------------------------
db.users.insertMany([
  {
    _id: ObjectId("60d0fe4f5311236168a109aa"),
    username: "admin",
    firstName: "Admin",
    lastName: "User",
    email: "admin@mediclinic.com",
    password: "$2a$12$1InE4YhH6AucZbTT5NCy8.lfBj8ORAsS1.zCM9BrN1QT8SrfJkESa", // hashed password for "password123"
    role: "admin",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109ab"),
    username: "manager",
    firstName: "Manager",
    lastName: "User",
    email: "manager@mediclinic.com",
    password: "$2a$12$1InE4YhH6AucZbTT5NCy8.lfBj8ORAsS1.zCM9BrN1QT8SrfJkESa", // hashed password for "password123"
    role: "manager",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109ac"),
    username: "user",
    firstName: "Regular",
    lastName: "User",
    email: "user@mediclinic.com",
    password: "$2a$12$1InE4YhH6AucZbTT5NCy8.lfBj8ORAsS1.zCM9BrN1QT8SrfJkESa", // hashed password for "password123"
    role: "user",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("61d0fe4f5311236168a109fd"),
    username: "hr_admin",
    firstName: "HR",
    lastName: "Admin",
    email: "hr@mediclinic.com",
    password: "$2a$12$1InE4YhH6AucZbTT5NCy8.lfBj8ORAsS1.zCM9BrN1QT8SrfJkESa", // hashed password for "password123"
    role: "admin",
    status: "active",
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  }
]);

// -------------------------------------------------------------
// LEAVE BALANCES FOR STAFF
// -------------------------------------------------------------
db.leavebalances.insertMany([
  // Jane Smith - Annual Leave
  {
    userId: ObjectId("60d0fe4f5311236168a109ca"), // Jane Smith
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    year: 2025,
    allocated: 20,
    used: 5,
    pending: 0,
    carried: 0,
    available: 15,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  // Jane Smith - Sick Leave
  {
    userId: ObjectId("60d0fe4f5311236168a109ca"), // Jane Smith
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
    year: 2025,
    allocated: 10,
    used: 2,
    pending: 0,
    carried: 0,
    available: 8,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  // Robert Johnson - Annual Leave
  {
    userId: ObjectId("60d0fe4f5311236168a109cb"), // Robert Johnson
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    year: 2025,
    allocated: 20,
    used: 10,
    pending: 2,
    carried: 5,
    available: 13,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  // Maria Garcia - Sick Leave
  {
    userId: ObjectId("60d0fe4f5311236168a109cc"), // Maria Garcia
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
    year: 2025,
    allocated: 10,
    used: 3,
    pending: 0,
    carried: 0,
    available: 7,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  }
]);

// -------------------------------------------------------------
// LEAVE BALANCES FOR DOCTORS
// -------------------------------------------------------------
db.leavebalances.insertMany([
  // David Wilson - Annual Leave
  {
    userId: ObjectId("60d0fe4f5311236168a109cd"), // David Wilson
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    year: 2025,
    allocated: 25,
    used: 10,
    pending: 0,
    carried: 0,
    available: 15,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  // Sarah Martinez - Annual Leave
  {
    userId: ObjectId("60d0fe4f5311236168a109ce"), // Sarah Martinez
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    year: 2025,
    allocated: 25,
    used: 5,
    pending: 5,
    carried: 0,
    available: 15,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  // Michael Brown - Sick Leave
  {
    userId: ObjectId("60d0fe4f5311236168a109cf"), // Michael Brown
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
    year: 2025,
    allocated: 15,
    used: 2,
    pending: 0,
    carried: 0,
    available: 13,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  }
]);

// -------------------------------------------------------------
// LEAVE BALANCES FOR USERS
// -------------------------------------------------------------
db.leavebalances.insertMany([
  // Regular User - Annual Leave
  {
    userId: ObjectId("60d0fe4f5311236168a109ac"), // Regular User
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    year: 2025,
    allocated: 20,
    used: 8,
    pending: 2,
    carried: 0,
    available: 10,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  },
  // Manager User - Annual Leave
  {
    userId: ObjectId("60d0fe4f5311236168a109ab"), // Manager User
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    year: 2025,
    allocated: 25,
    used: 5,
    pending: 0,
    carried: 2,
    available: 22,
    createdAt: ISODate("2023-08-28T08:00:00Z"),
    updatedAt: ISODate("2023-08-28T08:00:00Z")
  }
]);

// -------------------------------------------------------------
// LEAVE REQUESTS FOR STAFF
// -------------------------------------------------------------
db.leaverequests.insertMany([
  // Jane Smith - Approved Annual Leave (date range)
  {
    _id: ObjectId("60d0fe4f5311236168a109e0"),
    staffId: ObjectId("60d0fe4f5311236168a109ca"), // Jane Smith
    requestedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    startDate: ISODate("2025-09-10T00:00:00Z"),
    endDate: ISODate("2025-09-15T00:00:00Z"),
    reason: "Family vacation",
    contactDetails: "555-123-4567",
    status: "approved",
    approvedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    comments: "Approved as requested",
    createdAt: ISODate("2025-08-01T10:30:00Z"),
    updatedAt: ISODate("2025-08-02T14:15:00Z")
  },
  // Robert Johnson - Rejected Annual Leave (specific dates)
  {
    _id: ObjectId("60d0fe4f5311236168a109e2"),
    staffId: ObjectId("60d0fe4f5311236168a109cb"), // Robert Johnson
    requestedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    dates: [
      ISODate("2025-10-05T00:00:00Z"),
      ISODate("2025-10-06T00:00:00Z"),
      ISODate("2025-10-07T00:00:00Z")
    ],
    reason: "Personal matters",
    status: "rejected",
    rejectedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    comments: "High workload during this period",
    createdAt: ISODate("2025-08-15T11:20:00Z"),
    updatedAt: ISODate("2025-08-16T16:30:00Z")
  },
  // Maria Garcia - Pending Sick Leave (date range)
  {
    _id: ObjectId("61d0fe4f5311236168a109ff"),
    staffId: ObjectId("60d0fe4f5311236168a109cc"), // Maria Garcia
    requestedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
    startDate: ISODate("2025-11-12T00:00:00Z"),
    endDate: ISODate("2025-11-13T00:00:00Z"),
    reason: "Doctor's appointment",
    contactDetails: "555-888-9999",
    status: "pending",
    createdAt: ISODate("2025-10-25T09:15:00Z"),
    updatedAt: ISODate("2025-10-25T09:15:00Z")
  }
]);

// -------------------------------------------------------------
// LEAVE REQUESTS FOR DOCTORS
// -------------------------------------------------------------
db.leaverequests.insertMany([
  // David Wilson - Pending Sick Leave (date range)
  {
    _id: ObjectId("60d0fe4f5311236168a109e1"),
    doctorId: ObjectId("60d0fe4f5311236168a109cd"), // David Wilson
    requestedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
    startDate: ISODate("2025-08-20T00:00:00Z"),
    endDate: ISODate("2025-08-22T00:00:00Z"),
    reason: "Medical procedure",
    contactDetails: "555-987-6543",
    status: "pending",
    createdAt: ISODate("2025-08-10T09:45:00Z"),
    updatedAt: ISODate("2025-08-10T09:45:00Z")
  },
  // Sarah Martinez - Approved Annual Leave (specific dates)
  {
    _id: ObjectId("61d0fe4f5311236168a10100"),
    doctorId: ObjectId("60d0fe4f5311236168a109ce"), // Sarah Martinez
    requestedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    dates: [
      ISODate("2025-12-24T00:00:00Z"),
      ISODate("2025-12-26T00:00:00Z"),
      ISODate("2025-12-27T00:00:00Z")
    ],
    reason: "Holiday break",
    contactDetails: "555-444-3333",
    status: "approved",
    approvedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    comments: "Approved, coverage arranged",
    createdAt: ISODate("2025-11-01T16:20:00Z"),
    updatedAt: ISODate("2025-11-02T10:15:00Z")
  },
  // Michael Brown - Cancelled Study Leave (date range)
  {
    _id: ObjectId("61d0fe4f5311236168a10101"),
    doctorId: ObjectId("60d0fe4f5311236168a109cf"), // Michael Brown
    requestedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    leaveTypeId: ObjectId("61d0fe4f5311236168a109fb"), // Study Leave
    startDate: ISODate("2025-09-15T00:00:00Z"),
    endDate: ISODate("2025-09-19T00:00:00Z"),
    reason: "Medical conference",
    status: "cancelled",
    comments: "Conference postponed",
    createdAt: ISODate("2025-07-25T14:30:00Z"),
    updatedAt: ISODate("2025-08-05T11:45:00Z")
  }
]);

// -------------------------------------------------------------
// LEAVE REQUESTS FOR USERS
// -------------------------------------------------------------
db.leaverequests.insertMany([
  // Regular User - Pending Annual Leave (date range)
  {
    _id: ObjectId("61d0fe4f5311236168a10102"),
    userId: ObjectId("60d0fe4f5311236168a109ac"), // Regular User
    requestedBy: ObjectId("60d0fe4f5311236168a109ac"), // Self-requested
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    startDate: ISODate("2025-11-20T00:00:00Z"),
    endDate: ISODate("2025-11-24T00:00:00Z"),
    reason: "Personal vacation",
    contactDetails: "555-222-1111",
    status: "pending",
    createdAt: ISODate("2025-10-10T09:00:00Z"),
    updatedAt: ISODate("2025-10-10T09:00:00Z")
  },
  // Manager User - Approved Compassionate Leave (date range)
  {
    _id: ObjectId("61d0fe4f5311236168a10103"),
    userId: ObjectId("60d0fe4f5311236168a109ab"), // Manager User
    requestedBy: ObjectId("60d0fe4f5311236168a109ab"), // Self-requested
    leaveTypeId: ObjectId("61d0fe4f5311236168a109fc"), // Compassionate Leave
    startDate: ISODate("2025-10-01T00:00:00Z"),
    endDate: ISODate("2025-10-03T00:00:00Z"),
    reason: "Family emergency",
    status: "approved",
    approvedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    createdAt: ISODate("2025-09-29T08:15:00Z"),
    updatedAt: ISODate("2025-09-29T10:30:00Z")
  }
]);
