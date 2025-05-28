/**
 * Socket.io testing script
 * 
 * Run this with Node.js to test the socket connection:
 * node src/test-socket.js
 */

const { io } = require('socket.io-client');
const readline = require('readline');

// Socket URL
const SOCKET_URL = 'http://localhost:3000';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// This will simulate a doctor
const doctorSocket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
});

// This will simulate a patient
const patientSocket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  withCredentials: true
});

// Doctor ID (you'll need to provide this)
let doctorId = '';
rl.question('Enter doctor ID: ', (id) => {
  doctorId = id;
  console.log(`Using doctor ID: ${doctorId}`);
  
  // Join doctor room
  doctorSocket.emit('SWITCH_DOCTOR_AVAILABILITY', { doctorId });
  
  // Ask for patient ID
  rl.question('Enter patient ID: ', (patientId) => {
    console.log(`Using patient ID: ${patientId}`);
    
    // Generate a room name
    const roomName = `room-${Math.random().toString(36).substring(2, 11)}`;
    
    // Join patient to queue
    patientSocket.emit('PATIENT_JOIN_QUEUE', {
      doctorId,
      patientId,
      roomName
    });
    
    console.log(`Patient ${patientId} joining queue for doctor ${doctorId}`);
    console.log('Room name:', roomName);
    
    // Show menu
    showMenu();
  });
});

// Doctor socket event listeners
doctorSocket.on('connect', () => {
  console.log('Doctor socket connected:', doctorSocket.id);
});

doctorSocket.on('connect_error', (error) => {
  console.error('Doctor socket connection error:', error);
});

doctorSocket.on('QUEUE_CHANGED', (updatedQueue) => {
  console.log('Queue changed for doctor:', updatedQueue);
});

doctorSocket.on('NO_WAITING_PATIENTS', () => {
  console.log('No waiting patients in queue');
});

// Patient socket event listeners
patientSocket.on('connect', () => {
  console.log('Patient socket connected:', patientSocket.id);
});

patientSocket.on('connect_error', (error) => {
  console.error('Patient socket connection error:', error);
});

patientSocket.on('QUEUE_POSITION_UPDATE', (status) => {
  console.log('Queue position update for patient:', status);
});

patientSocket.on('INVITE_PATIENT', (data) => {
  console.log('Patient invited to consultation:', data);
});

patientSocket.on('CONSULTATION_ENDED', () => {
  console.log('Consultation ended for patient');
});

patientSocket.on('ERROR', (data) => {
  console.error('Error for patient:', data.message);
});

// Handle menu options
function showMenu() {
  console.log('\n--- Menu ---');
  console.log('1. Invite next patient');
  console.log('2. Leave queue (patient)');
  console.log('3. End consultation');
  console.log('4. Exit');
  
  rl.question('Select an option: ', (option) => {
    switch(option) {
      case '1':
        doctorSocket.emit('INVITE_NEXT_PATIENT', { doctorId });
        console.log('Inviting next patient...');
        break;
      case '2':
        rl.question('Enter patient ID to leave queue: ', (patientId) => {
          patientSocket.emit('LEAVE_QUEUE', { doctorId, patientId });
          console.log(`Patient ${patientId} leaving queue...`);
          showMenu();
        });
        return;
      case '3':
        rl.question('Enter consultation ID to end: ', (consultationId) => {
          doctorSocket.emit('END_CONSULTATION', { consultationId });
          console.log(`Ending consultation ${consultationId}...`);
          showMenu();
        });
        return;
      case '4':
        console.log('Disconnecting sockets...');
        doctorSocket.disconnect();
        patientSocket.disconnect();
        rl.close();
        return;
      default:
        console.log('Invalid option');
    }
    
    showMenu();
  });
}

// Handle exit
rl.on('close', () => {
  console.log('Exiting...');
  process.exit(0);
}); 