# Medical Clinic Management System

## Quick Start Commands

### Backend (MedialClinic)

```powershell
# Install dependencies
cd MedialClinic
npm install

# Seed email templates
npm run seed:templates

# Start development server
npm run dev

# Start production server
npm start
```

### Frontend (MedicalClinicFrontend)

```powershell
# Install dependencies
cd MedicalClinicFrontend
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Testing the User Registration Flow

1. Start both backend and frontend servers
2. Register a new user with role "doctor" or "staff"
3. Check the console logs for the email that would be sent to admin
4. Use the approval link to approve the user
5. The user can now log in with their credentials
