# Frontend Fix Guide

This guide will help you fix any issues on the frontend related to the PatientQueue changes.

## Issue in VideoCallInterface.tsx

Looking at the image you shared, there's an error when patients try to join the queue. The updated backend fixes the issue "Table 'emedihub.patientqueues' doesn't exist", but there might be some compatibility issues with how the frontend expects the data.

### Steps to Fix Frontend

1. Make sure the frontend is connecting to the correct backend URL
2. Check that the socket events match between frontend and backend

## Socket Event Changes

The PatientQueue model has been simplified and the following fields have been removed:
- `position` (now calculated dynamically)
- `estimatedWaitTime` (now calculated dynamically)
- `patientFirstName` and `patientLastName` (avoiding duplication)

But the socket events still provide compatible data:

- `PATIENT_JOIN_QUEUE` event still accepts the same parameters
- `QUEUE_POSITION_UPDATE` event still returns `position` and `estimatedWait`

## CORS Configuration

Make sure your CORS settings allow connections from your frontend domain. In the server.js file, the following origins are allowed:

```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];
```

If your frontend is hosted at a different URL, add it to the allowedOrigins array.

## Debugging Socket Connections

To debug socket issues on the frontend:

1. Add these console logs in your VideoCallInterface.tsx:

```typescript
// In the useEffect where socket is initialized
const newSocket = initializeSocket();
console.log('Socket initialized:', newSocket);

// Add event listeners for debugging
newSocket.on('connect', () => {
  console.log('Socket connected with ID:', newSocket.id);
});

newSocket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

newSocket.on('ERROR', (error) => {
  console.error('Socket error from server:', error);
});
```

2. Check the browser console for these logs and any errors

## Testing the Connection

You can test the socket connection with a simple test client:

```javascript
// test-client.js
const { io } = require("socket.io-client");

// Connect to your backend
const socket = io("http://localhost:3000");

socket.on("connect", () => {
  console.log("Connected with socket ID:", socket.id);
  
  // Test joining a queue
  socket.emit('PATIENT_JOIN_QUEUE', {
    doctorId: '29',  // Replace with a valid doctor ID
    patientId: '24', // Replace with a valid patient ID
    roomName: 'test-room'
  });
});

socket.on("QUEUE_POSITION_UPDATE", (data) => {
  console.log("Received queue position update:", data);
});

socket.on("ERROR", (data) => {
  console.error("Received error:", data);
});

// Keep the process running
process.stdin.resume();
```

Run this script to test if your backend is working correctly.

## Setting up Proper Error Handling in Frontend

Update your VideoCallInterface.tsx with better error handling:

```typescript
// In the useEffect initialization
newSocket.on('ERROR', (error) => {
  console.error('Socket error from server:', error);
  setError(error.message || 'Error connecting to the video queue');
});

// Add this state if not already present
const [error, setError] = useState<string | null>(null);

// In your render function, display errors to the user
{error && (
  <div className="error-message bg-red-500 text-white p-2 rounded">
    {error}
  </div>
)}
```

By following these steps, you should be able to fix any frontend issues related to the PatientQueue changes. 