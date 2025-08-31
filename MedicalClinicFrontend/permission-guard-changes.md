# Required Changes for Permission Guards

The following files need to be updated to use `permission` instead of `requiredPermissions` in the PermissionGuard components:

## 1. DoctorManagement.tsx

Line 539:
```tsx
<PermissionGuard requiredPermissions={Permission.EDIT_DOCTOR}>
```
Should be changed to:
```tsx
<PermissionGuard permission={Permission.EDIT_DOCTOR}>
```

Line 549:
```tsx
<PermissionGuard requiredPermissions={Permission.TOGGLE_DOCTOR_STATUS}>
```
Should be changed to:
```tsx
<PermissionGuard permission={Permission.TOGGLE_DOCTOR_STATUS}>
```

## 2. DepartmentManagement.tsx

Line 274:
```tsx
<PermissionGuard requiredPermissions={Permission.ADD_DEPARTMENT}>
```
Should be changed to:
```tsx
<PermissionGuard permission={Permission.ADD_DEPARTMENT}>
```

Line 380:
```tsx
<PermissionGuard requiredPermissions={Permission.EDIT_DEPARTMENT}>
```
Should be changed to:
```tsx
<PermissionGuard permission={Permission.EDIT_DEPARTMENT}>
```

Line 389:
```tsx
<PermissionGuard requiredPermissions={Permission.DELETE_DEPARTMENT}>
```
Should be changed to:
```tsx
<PermissionGuard permission={Permission.DELETE_DEPARTMENT}>
```

Line 402:
```tsx
<PermissionGuard requiredPermissions={Permission.TOGGLE_DEPARTMENT_STATUS}>
```
Should be changed to:
```tsx
<PermissionGuard permission={Permission.TOGGLE_DEPARTMENT_STATUS}>
```

## 3. App.tsx

For the App.tsx file, we should check if the `ProtectedRoute` component also needs to be updated. If it does, we would need to update its interface in the component file and then change all usages in App.tsx.

Line 100:
```tsx
<ProtectedRoute requiredPermissions={Permission.VIEW_PATIENTS}>
```

Line 106:
```tsx
<ProtectedRoute requiredPermissions={Permission.ADD_PATIENT}>
```

Line 112:
```tsx
<ProtectedRoute requiredPermissions={Permission.VIEW_PATIENTS}>
```

However, since we already checked the ProtectedRoute component and confirmed it correctly uses `requiredPermissions` in its interface, these usages should remain unchanged.

## Important Note

When making these changes, we need to ensure the codebase is consistent. It's important to note that:

1. `PermissionGuard` should use `permission` prop
2. `ProtectedRoute` should continue to use `requiredPermissions` prop
