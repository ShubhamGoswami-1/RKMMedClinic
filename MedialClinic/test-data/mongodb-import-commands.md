# MongoDB Import Commands for Test Data

# Use these commands in the MongoDB shell or MongoDB Compass to import test data
# Make sure to run these commands one collection at a time

# -------------------------------------------------------------
# STAFF DATA (3 records)
# -------------------------------------------------------------
db.staffs.insertMany([
  {
    _id: ObjectId("60d0fe4f5311236168a109ca"),
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
    _id: ObjectId("60d0fe4f5311236168a109cb"),
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
    _id: ObjectId("60d0fe4f5311236168a109cc"),
    firstName: "Maria",
    lastName: "Garcia",
    email: "maria.garcia@mediclinic.com",
    department: "Laboratory",
    designation: "Lab Technician",
    status: "active",
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  }
]);

# -------------------------------------------------------------
# DOCTOR DATA (3 records)
# -------------------------------------------------------------
db.doctors.insertMany([
  {
    _id: ObjectId("60d0fe4f5311236168a109cd"),
    firstName: "David",
    lastName: "Wilson",
    email: "david.wilson@mediclinic.com",
    departmentId: ObjectId("60d0fe4f5311236168a109d0"), // Assuming this is the ID of Cardiology department
    specialization: "Cardiology",
    status: "active",
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109ce"),
    firstName: "Sarah",
    lastName: "Martinez",
    email: "sarah.martinez@mediclinic.com",
    departmentId: ObjectId("60d0fe4f5311236168a109d1"), // Assuming this is the ID of Pediatrics department
    specialization: "Pediatrics",
    status: "active",
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109cf"),
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@mediclinic.com",
    departmentId: ObjectId("60d0fe4f5311236168a109d2"), // Assuming this is the ID of Orthopedics department
    specialization: "Orthopedics",
    status: "active",
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  }
]);

# -------------------------------------------------------------
# LEAVE TYPES (3 records)
# -------------------------------------------------------------
db.leavetypes.insertMany([
  {
    _id: ObjectId("60d0fe4f5311236168a109d3"),
    name: "Annual Leave",
    description: "Regular annual leave entitlement",
    defaultDays: 20,
    color: "#4CAF50", // Green
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109d4"),
    name: "Sick Leave",
    description: "Leave for illness or medical appointments",
    defaultDays: 10,
    color: "#F44336", // Red
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109d5"),
    name: "Maternity/Paternity Leave",
    description: "Leave for new parents",
    defaultDays: 30,
    color: "#2196F3", // Blue
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  }
]);

# -------------------------------------------------------------
# LEAVE BALANCES (3 records for staff)
# -------------------------------------------------------------
db.leavebalances.insertMany([
  {
    userId: ObjectId("60d0fe4f5311236168a109ca"), // Jane Smith
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
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
    userId: ObjectId("60d0fe4f5311236168a109cb"), // Robert Johnson
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
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
    userId: ObjectId("60d0fe4f5311236168a109cc"), // Maria Garcia
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
    year: 2025,
    allocated: 10,
    used: 3,
    pending: 0,
    carried: 0,
    available: 7,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  }
]);

# -------------------------------------------------------------
# LEAVE BALANCES (3 records for doctors)
# -------------------------------------------------------------
db.leavebalances.insertMany([
  {
    userId: ObjectId("60d0fe4f5311236168a109cd"), // David Wilson
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
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
    userId: ObjectId("60d0fe4f5311236168a109ce"), // Sarah Martinez
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
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
    userId: ObjectId("60d0fe4f5311236168a109cf"), // Michael Brown
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
    year: 2025,
    allocated: 15,
    used: 2,
    pending: 0,
    carried: 0,
    available: 13,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  }
]);

# -------------------------------------------------------------
# EXAMPLE LEAVE REQUESTS (3 records)
# -------------------------------------------------------------
db.leaverequests.insertMany([
  {
    _id: ObjectId("60d0fe4f5311236168a109e0"),
    staffId: ObjectId("60d0fe4f5311236168a109ca"), // Jane Smith
    requestedBy: ObjectId("60d0fe4f5311236168a109aa"), // Assuming this is your admin user ID
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    startDate: new Date("2025-09-10T00:00:00Z"),
    endDate: new Date("2025-09-15T00:00:00Z"),
    reason: "Family vacation",
    contactDetails: "555-123-4567",
    status: "approved",
    approvedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    comments: "Approved as requested",
    createdAt: new Date("2025-08-01T10:30:00Z"),
    updatedAt: new Date("2025-08-02T14:15:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109e1"),
    doctorId: ObjectId("60d0fe4f5311236168a109cd"), // David Wilson
    requestedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d4"), // Sick Leave
    startDate: new Date("2025-08-20T00:00:00Z"),
    endDate: new Date("2025-08-22T00:00:00Z"),
    reason: "Medical procedure",
    contactDetails: "555-987-6543",
    status: "pending",
    createdAt: new Date("2025-08-10T09:45:00Z"),
    updatedAt: new Date("2025-08-10T09:45:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109e2"),
    staffId: ObjectId("60d0fe4f5311236168a109cb"), // Robert Johnson
    requestedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    leaveTypeId: ObjectId("60d0fe4f5311236168a109d3"), // Annual Leave
    dates: [
      new Date("2025-10-05T00:00:00Z"),
      new Date("2025-10-06T00:00:00Z"),
      new Date("2025-10-07T00:00:00Z")
    ],
    reason: "Personal matters",
    status: "rejected",
    rejectedBy: ObjectId("60d0fe4f5311236168a109aa"), // Admin user
    comments: "High workload during this period",
    createdAt: new Date("2025-08-15T11:20:00Z"),
    updatedAt: new Date("2025-08-16T16:30:00Z")
  }
]);

# -------------------------------------------------------------
# USER DATA (for testing admin/manager roles)
# -------------------------------------------------------------
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
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
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
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
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
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  }
]);
