// This file contains test data for the Staff Management feature
// You can use this to test the staff creation and leave allocation functionality

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
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109d6"),
    name: "Study Leave",
    description: "Leave for education and professional development",
    defaultDays: 5,
    color: "#9C27B0", // Purple
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109d7"),
    name: "Compassionate Leave",
    description: "Leave for bereavement or family emergencies",
    defaultDays: 3,
    color: "#FF9800", // Orange
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  }
]);

// Sample departments for staff assignment
db.departments.insertMany([
  {
    _id: ObjectId("60d0fe4f5311236168a109d0"),
    name: "Cardiology",
    description: "Department for heart-related treatments",
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109d1"),
    name: "Pediatrics",
    description: "Department for children's healthcare",
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a109d2"),
    name: "Orthopedics",
    description: "Department for bone and joint treatments",
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a10ad0"),
    name: "Administration",
    description: "Administration department",
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a10ad1"),
    name: "Nursing",
    description: "Nursing department",
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  },
  {
    _id: ObjectId("60d0fe4f5311236168a10ad2"),
    name: "Laboratory",
    description: "Medical testing laboratory",
    isActive: true,
    createdAt: new Date("2023-08-28T08:00:00Z"),
    updatedAt: new Date("2023-08-28T08:00:00Z")
  }
]);

// Create admin user with appropriate permissions
db.users.insertOne({
  _id: ObjectId("60d0fe4f5311236168a109aa"),
  username: "admin",
  firstName: "Admin",
  lastName: "User",
  email: "admin@mediclinic.com",
  password: "$2a$12$1InE4YhH6AucZbTT5NCy8.lfBj8ORAsS1.zCM9BrN1QT8SrfJkESa", // hashed password for "password123"
  role: "admin",
  permissions: [
    "MANAGE_STAFF",
    "VIEW_STAFF",
    "EDIT_STAFF",
    "DELETE_STAFF",
    "MANAGE_LEAVE",
    "VIEW_LEAVE_BALANCES",
    "VIEW_ALL_LEAVE_REQUESTS",
    "MANAGE_LEAVE_TYPES"
  ],
  status: "active",
  createdAt: new Date("2023-08-28T08:00:00Z"),
  updatedAt: new Date("2023-08-28T08:00:00Z")
});

// Sample MongoDB script to test leave balance creation
// This demonstrates how the API should handle leave balance creation
const createStaffWithLeaveBalances = async () => {
  // Step 1: Create a staff record
  const staffData = {
    firstName: "New",
    lastName: "Employee",
    email: "new.employee@mediclinic.com",
    department: ObjectId("60d0fe4f5311236168a10ad0"), // Administration
    designation: "Assistant",
    joinDate: new Date("2023-08-01"),
    status: "active"
  };
  
  const staff = await db.staffs.insertOne(staffData);
  const staffId = staff.insertedId;
  
  // Step 2: Create leave balances for all leave types
  const leaveTypes = await db.leavetypes.find({ isActive: true }).toArray();
  const currentYear = new Date().getFullYear();
  
  const leaveBalances = leaveTypes.map(leaveType => ({
    userId: staffId,
    leaveTypeId: leaveType._id,
    year: currentYear,
    allocated: leaveType.defaultDays,
    used: 0,
    pending: 0,
    available: leaveType.defaultDays,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  
  await db.leavebalances.insertMany(leaveBalances);
  
  console.log(`Created staff '${staffData.firstName} ${staffData.lastName}' with ${leaveBalances.length} leave balances`);
};

// Run this function to test the staff creation with leave balances
// createStaffWithLeaveBalances();
