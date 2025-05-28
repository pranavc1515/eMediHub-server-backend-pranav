/**
 * Socket.io Client test script for testing PatientQueue functionality
 * Run this script to test if your backend is properly handling queue events
 */

const { io } = require("socket.io-client");
const readline = require('readline');

const API_URL = process.env.API_URL || "http://localhost:3000";

// Create interface for command-line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`Connecting to ${API_URL}...`);

// Connect to server
const socket = io(API_URL, {
  transports: ['websocket', 'polling']
});

// Socket event handlers
socket.on("connect", () => {
  console.log(`✅ Connected with socket ID: ${socket.id}`);
  showMenu();
});

socket.on("connect_error", (error) => {
  console.error(`❌ Connection error: ${error.message}`);
});

socket.on("disconnect", () => {
  console.log("❌ Disconnected from server");
});

// Queue event handlers
socket.on("QUEUE_POSITION_UPDATE", (data) => {
  console.log("-----------------------------");
  console.log("📊 Queue position update:");
  console.log(`   Position: ${data.position}`);
  console.log(`   Estimated wait: ${data.estimatedWait}`);
  console.log("-----------------------------");
});

socket.on("INVITE_PATIENT", (data) => {
  console.log("-----------------------------");
  console.log("🔔 Invited to consultation!");
  console.log(`   Room: ${data.roomName}`);
  console.log(`   Consultation ID: ${data.consultationId}`);
  console.log("-----------------------------");
});

socket.on("CONSULTATION_ENDED", () => {
  console.log("-----------------------------");
  console.log("🏁 Consultation ended");
  console.log("-----------------------------");
});

socket.on("ERROR", (data) => {
  console.error(`❌ Error from server: ${data.message}`);
});

// Menu functions
function showMenu() {
  console.log("\n========= Test Menu =========");
  console.log("1. Join queue as patient");
  console.log("2. Join as doctor");
  console.log("3. Invite next patient (doctor)");
  console.log("4. Leave queue (patient)");
  console.log("5. End consultation (doctor)");
  console.log("6. Exit");
  console.log("=============================");

  rl.question("Select an option: ", (option) => {
    switch (option) {
      case "1":
        joinQueue();
        break;
      case "2":
        joinAsDoctor();
        break;
      case "3":
        inviteNextPatient();
        break;
      case "4":
        leaveQueue();
        break;
      case "5":
        endConsultation();
        break;
      case "6":
        console.log("Exiting...");
        socket.disconnect();
        rl.close();
        process.exit(0);
        break;
      default:
        console.log("Invalid option");
        showMenu();
    }
  });
}

function joinQueue() {
  rl.question("Enter doctor ID: ", (doctorId) => {
    rl.question("Enter patient ID: ", (patientId) => {
      const roomName = `room-test-${Date.now()}`;
      
      console.log(`Joining queue for doctor ${doctorId} as patient ${patientId}...`);
      socket.emit("PATIENT_JOIN_QUEUE", {
        doctorId,
        patientId,
        roomName
      });

      showMenu();
    });
  });
}

function joinAsDoctor() {
  rl.question("Enter your doctor ID: ", (doctorId) => {
    console.log(`Joining as doctor ${doctorId}...`);
    socket.emit("SWITCH_DOCTOR_AVAILABILITY", { doctorId });
    showMenu();
  });
}

function inviteNextPatient() {
  rl.question("Enter your doctor ID: ", (doctorId) => {
    console.log("Inviting next patient...");
    socket.emit("INVITE_NEXT_PATIENT", { doctorId });
    showMenu();
  });
}

function leaveQueue() {
  rl.question("Enter doctor ID: ", (doctorId) => {
    rl.question("Enter patient ID: ", (patientId) => {
      console.log("Leaving queue...");
      socket.emit("LEAVE_QUEUE", { doctorId, patientId });
      showMenu();
    });
  });
}

function endConsultation() {
  rl.question("Enter consultation ID: ", (consultationId) => {
    console.log("Ending consultation...");
    socket.emit("END_CONSULTATION", { consultationId });
    showMenu();
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('Disconnecting...');
  socket.disconnect();
  rl.close();
  process.exit(0);
}); 