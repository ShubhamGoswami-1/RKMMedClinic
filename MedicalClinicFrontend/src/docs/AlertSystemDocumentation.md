# Global Alert System Documentation

## Overview
The global alert system provides a standardized way to display notifications across the Medical Clinic application. It supports different alert types, customizable durations, auto-close behavior, and custom titles.

## Components

### 1. Alert Component
The core component responsible for displaying alerts with various styles based on the alert type.

**Features:**
- Four alert types: success, error, info, warning
- Configurable auto-close behavior
- Customizable duration
- Optional custom title
- Smooth animations for entry/exit

### 2. AlertContext
Manages the global state of alerts throughout the application.

**Features:**
- Provides a context API for showing/hiding alerts
- Maintains an alert queue for potential multi-alert support
- Handles alert lifecycle management

### 3. useGlobalAlert Hook
Provides a simplified API for using alerts in any component.

## Usage Examples

### Basic Usage
```jsx
import { useGlobalAlert } from '../hooks/useGlobalAlert';

const YourComponent = () => {
  const { showSuccessAlert, showErrorAlert, showInfoAlert, showWarningAlert } = useGlobalAlert();

  const handleSuccess = () => {
    showSuccessAlert('Operation completed successfully!');
  };

  return (
    <button onClick={handleSuccess}>
      Complete Operation
    </button>
  );
};
```

### Advanced Usage with Options
```jsx
import { useGlobalAlert } from '../hooks/useGlobalAlert';

const YourComponent = () => {
  const { showErrorAlert } = useGlobalAlert();

  const handleError = () => {
    showErrorAlert('An error occurred while processing your request.', {
      duration: 10000, // 10 seconds
      autoClose: false, // Must be manually closed
      title: 'Critical Error' // Custom title
    });
  };

  return (
    <button onClick={handleError}>
      Test Error Alert
    </button>
  );
};
```

### Available Methods

#### showAlert(type, message, options)
Base method for showing alerts.
- `type`: 'success' | 'error' | 'info' | 'warning'
- `message`: The alert message
- `options`: Optional configuration object
  - `duration`: Time in ms before auto-closing
  - `autoClose`: Whether to auto-close
  - `title`: Custom title override

#### Convenience Methods
- `showSuccessAlert(message, options)`
- `showErrorAlert(message, options)`
- `showInfoAlert(message, options)`
- `showWarningAlert(message, options)`

#### hideAlert()
Manually closes the current alert.

## Styling
The alerts use Tailwind CSS for styling and are designed to match the application's theme.

## Implementation in App.tsx
To enable alerts globally, the application is wrapped with the `AlertProvider`:

```jsx
import { AlertProvider } from './context/AlertContext';

function App() {
  return (
    <AlertProvider>
      {/* rest of your app */}
    </AlertProvider>
  );
}
```
