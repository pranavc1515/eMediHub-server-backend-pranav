# Database Fix Guide

This guide helps fix issues with the database tables for the eMediHub application.

## Key Issues Fixed

1. **Too many keys error in `doctor_personal` table**
   - Problem: There are too many unique constraints (>64) on the `phoneNumber` and `email` columns
   - Fix: A script to remove excessive indexes and add only one unique constraint for each column

2. **PatientQueue foreign key type mismatch**
   - Problem: The `patientId` in `PatientQueues` (UUID) doesn't match the type in `patients` (CHAR(36))
   - Fix: Updated model and create table script with correct data types

3. **Consultations table doesn't exist**
   - Problem: The `Consultations` table referenced by `PatientQueues` doesn't exist
   - Fix: Create table script with proper schema and foreign keys

## Solution: Run the Fix Script

```bash
npm run fix-db
```

This script will:
1. Fix the `doctor_personal` table by removing excessive indexes
2. Create the `Consultations` table with correct data types
3. Create the `PatientQueues` table with correct data types
4. Set up proper foreign key relationships

## Step by Step Instructions

### 1. Fix the Database Schema

Run the database fix script:

```bash
npm run fix-db
```

### 2. Start the Server

After fixing the database, start the server:

```bash
npm start
```

### 3. Test the Video Queue

Use the test script to verify the queue functionality:

```bash
npm run test-socket
```

Follow the prompts to test joining the queue as a patient or doctor.

## Manual Fixes (if needed)

If the automatic fix doesn't work, you can run these SQL commands directly:

```sql
-- Fix doctor_personal table
SET FOREIGN_KEY_CHECKS=0;

-- Drop all indexes except primary key
SELECT CONCAT('ALTER TABLE doctor_personal DROP INDEX ', INDEX_NAME, ';') 
FROM information_schema.STATISTICS 
WHERE TABLE_NAME = 'doctor_personal' 
AND INDEX_NAME != 'PRIMARY'
AND TABLE_SCHEMA = DATABASE();

-- Add single unique constraint for email and phoneNumber
ALTER TABLE doctor_personal ADD UNIQUE INDEX phoneNumber_idx (phoneNumber);
ALTER TABLE doctor_personal ADD UNIQUE INDEX email_idx (email);

-- Create Consultations table
CREATE TABLE Consultations (
  id CHAR(36) NOT NULL PRIMARY KEY,
  patientId CHAR(36) NOT NULL,
  doctorId INT NOT NULL,
  scheduledDate DATE NOT NULL,
  startTime TIME NOT NULL,
  endTime TIME NOT NULL,
  status ENUM('pending', 'ongoing', 'completed', 'cancelled') DEFAULT 'pending',
  consultationType ENUM('video', 'in-person') DEFAULT 'video',
  roomName VARCHAR(255),
  notes TEXT,
  cancelReason VARCHAR(255),
  cancelledBy ENUM('patient', 'doctor'),
  actualStartTime DATETIME,
  actualEndTime DATETIME,
  twilioRoomSid VARCHAR(255),
  patientSocketId VARCHAR(255),
  doctorSocketId VARCHAR(255),
  queuePosition INT,
  estimatedDuration INT DEFAULT 15,
  symptoms TEXT,
  prescription TEXT,
  diagnosis TEXT,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_consultation_patient FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_consultation_doctor FOREIGN KEY (doctorId) REFERENCES doctor_personal(id) ON DELETE CASCADE
);

-- Create PatientQueues table
CREATE TABLE PatientQueues (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  patientId CHAR(36) NOT NULL,
  doctorId INT NOT NULL,
  status ENUM('waiting', 'in_consultation', 'done', 'left') DEFAULT 'waiting',
  joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  roomName VARCHAR(255) NOT NULL,
  socketId VARCHAR(255),
  consultationId CHAR(36),
  priority INT DEFAULT 0,
  hasJoinedRoom TINYINT(1) NOT NULL DEFAULT 0,
  consultationStartedAt DATETIME,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_patientqueue_patient FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_patientqueue_doctor FOREIGN KEY (doctorId) REFERENCES doctor_personal(id) ON DELETE CASCADE,
  CONSTRAINT fk_patientqueue_consultation FOREIGN KEY (consultationId) REFERENCES Consultations(id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS=1;
```

## Troubleshooting

If you still encounter issues:

1. Check MySQL error logs for more details
2. Verify that table names match the model definitions (case-sensitive)
3. Ensure database user has privileges to create/alter tables
4. Temporarily disable foreign key checks during table creation 