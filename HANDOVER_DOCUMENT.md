# eMediHub Server Backend - Project Handover Document

## Table of Contents

- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Authentication & Authorization](#authentication--authorization)
- [Real-time Features](#real-time-features)
- [Payment System](#payment-system)
- [File Management](#file-management)
- [Environment Configuration](#environment-configuration)
- [Database Setup & Scripts](#database-setup--scripts)
- [Recent Major Changes](#recent-major-changes)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)
- [Admin APIs (Brief Overview)](#admin-apis-brief-overview)

---

## Project Overview

**eMediHub** is a comprehensive telemedicine platform backend that enables video consultations between patients and doctors. The system supports real-time queue management, payment processing, patient management, and doctor onboarding with VDC (Video/Digital Consultation) opt-in capabilities.

### Core Features

- JWT-based authentication for multiple user types
- Video consultation queue system with real-time updates
- External payment microservice integration
- Doctor management with VDC opt-in system
- Patient management via external microservice
- Real-time Socket.IO communication
- AWS S3 file upload integration
- Comprehensive API documentation with Swagger

---

## System Architecture

The system follows a **microservice-friendly architecture** with modular design:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   eMediHub      │    │   External      │
│   Applications  │───▶│   Backend       │───▶│   Services      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │                        │
                              ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   MySQL         │    │ Payment Service │
                       │   Database      │    │ Patient Service │
                       │                 │    │ Reports Service │
                       └─────────────────┘    └─────────────────┘
```

### Key Components:

- **Express.js Server** with RESTful APIs
- **Socket.IO Server** for real-time communication
- **MySQL Database** with Sequelize ORM
- **External Microservices** for payments, patient management, and reports
- **AWS S3** for file storage
- **Twilio** for video consultation infrastructure

---

## Technology Stack

### Backend Framework

- **Node.js** with Express.js
- **Socket.IO** for real-time communication
- **Sequelize ORM** for database operations

### Database

- **MySQL** as primary database
- **Sequelize** for ORM and migrations

### External Services

- **AWS S3** for file storage
- **Twilio** for video calling
- **External Payment Microservice** (Razorpay integration)

### Security & Authentication

- **JWT** for token-based authentication
- **bcryptjs** for password hashing
- **CORS** configuration for cross-origin requests

### Development Tools

- **Swagger** for API documentation
- **Winston** for logging
- **Nodemon** for development
- **Morgan** for HTTP request logging

---

## Database Schema

### Core Models

#### 1. Doctor Management

```sql
-- Doctor Personal Information
doctor_personal {
  id: INTEGER (Primary Key)
  fullName: STRING
  phoneNumber: STRING
  email: STRING
  password: STRING (hashed)
  gender: ENUM('Male', 'Female', 'Other')
  dob: DATE
  status: ENUM('Active', 'Inactive')
  profilePhoto: STRING
  isOnline: ENUM('available', 'offline')
  isVerified: BOOLEAN
}

-- Doctor Professional Information
doctor_professional {
  id: INTEGER (Primary Key)
  doctorId: INTEGER (FK to doctor_personal)
  qualification: STRING
  specialization: STRING
  registrationNumber: STRING
  registrationState: STRING
  expiryDate: DATE
  certificates: JSON
  yearsOfExperience: INTEGER
  consultationFees: DECIMAL
  availableDays: JSON
  availableTimeSlots: JSON
  vdcEnabled: BOOLEAN (VDC opt-in status)
  paymentOptions: JSON
}
```

#### 2. Consultation System

```sql
-- Consultation records
consultation {
  id: INTEGER (Primary Key)
  patientId: INTEGER
  doctorId: INTEGER (FK to doctor_personal)
  scheduledDate: DATE
  startTime: TIME
  endTime: TIME
  status: ENUM('pending', 'ongoing', 'completed', 'cancelled')
  consultationType: ENUM('video', 'in-person')
  roomName: STRING
  notes: TEXT
  actualStartTime: DATETIME
  actualEndTime: DATETIME
  paymentId: STRING (Payment microservice ID)
  -- Real-time fields
  twilioRoomSid: STRING
  patientSocketId: STRING
  doctorSocketId: STRING
  queuePosition: INTEGER
  estimatedDuration: INTEGER
  symptoms: TEXT
  prescription: TEXT
  diagnosis: TEXT
}
```

#### 3. patient System

```sql
-- Real-time Queue Management
patient_queue {
  id: INTEGER (Primary Key)
  userId: INTEGER (Platform owner ID)
  patientId: INTEGER (External patient service ID)
  patientName: STRING (cached from external service)
  patientPhone: STRING (cached from external service)
  doctorId: INTEGER (FK to doctor_personal)
  position: INTEGER
  status: ENUM('waiting', 'in_consultation', 'done', 'left')
  joinedAt: DATETIME
  roomName: STRING
  socketId: STRING
  consultationId: INTEGER (FK to consultation)
  priority: INTEGER
  hasJoinedRoom: BOOLEAN
}
```

#### 4. Content Management

```sql
-- CMS for FAQ, policies, help content
contents {
  id: INTEGER (Primary Key)
  type: STRING (faq, policy, help, about)
  title: STRING
  content: TEXT
  status: STRING (draft, published, archived)
  order: INTEGER
  metaData: TEXT (JSON)
}

-- System configurations
system_configs {
  id: INTEGER (Primary Key)
  key: STRING (unique)
  value: TEXT
  description: STRING
}

-- Medical specializations
specializations {
  id: INTEGER (Primary Key)
  name: STRING (unique)
  description: TEXT
  consultationFee: FLOAT
  icon: STRING
  status: BOOLEAN
}
```

---

## API Endpoints

### Authentication APIs (`/api/auth`)

```http
POST /api/auth/register          # Register new patient
POST /api/auth/login             # Patient login
POST /api/auth/register-admin    # Register admin user
POST /api/auth/login-admin       # Admin login
```

### Patient APIs (`/api/patients`)

```http
# Registration & Login (Proxy to external service)
POST /api/patients/register-new      # Register new patient (phone-based)
POST /api/patients/do-login          # Login with phone/username
POST /api/patients/verify-otp        # Verify OTP for login
POST /api/patients/resend-otp        # Resend OTP

# Profile Management (Proxy to external service)
GET /api/patients/profile            # Get patient profile
PUT /api/patients/profile            # Update patient profile
GET /api/patients/family-members     # Get family members
POST /api/patients/family-members    # Add family member
PUT /api/patients/family-members/:id # Update family member
DELETE /api/patients/family-members/:id # Remove family member

# Health Records (Proxy to external service)
GET /api/patients/health-records     # Get health records
POST /api/patients/health-records    # Add health record
PUT /api/patients/health-records/:id # Update health record
DELETE /api/patients/health-records/:id # Delete health record
```

### Patient Consultation APIs (`/api/consultation`)

```http
POST /api/consultation/book          # Book video consultation
GET /api/consultation/history        # Get consultation history
GET /api/consultation/:id            # Get consultation details
DELETE /api/consultation/:id/cancel  # Cancel consultation
```

### Doctor APIs (`/api/doctors`)

```http
# Registration & Authentication
POST /api/doctors/register           # Register with phone number
POST /api/doctors/login              # Login for existing doctor
POST /api/doctors/verify-otp         # Verify OTP during registration/login
POST /api/doctors/resend-otp         # Resend OTP

# Profile Management
GET /api/doctors/profile             # Get complete doctor profile
PUT /api/doctors/personal-details/:id # Update personal information
PUT /api/doctors/professional-details/:id # Update professional information
POST /api/doctors/upload-profile-photo # Upload profile photo
POST /api/doctors/upload-certificates # Upload professional certificates

# VDC (Video/Digital Consultation) Management
GET /api/doctors/vdc-status          # Check VDC opt-in status
GET /api/doctors/vdc-settings        # Get VDC settings
PUT /api/doctors/vdc-settings        # Update VDC settings (fees, availability)

# Public APIs
GET /api/doctors/search              # Search doctors (public)
GET /api/doctors/list                # List all doctors (public)
GET /api/doctors/:id                 # Get doctor details (public)
GET /api/doctors/by-specialization/:specialization # Doctors by specialty
```

### Doctor Consultation APIs (`/api/doctor/consultations`)

```http
GET /api/doctor/consultations/queue     # Get current patient queue
POST /api/doctor/consultations/start/:id # Start consultation with patient
POST /api/doctor/consultations/end/:id   # End consultation
GET /api/doctor/consultations/current    # Get currently active consultation
GET /api/doctor/consultations/history    # Get consultation history
```

### Video APIs (`/api/video`)

```http
POST /api/video/token                # Generate Twilio access token
POST /api/video/room                 # Create video room
GET /api/video/rooms                 # List active rooms
GET /api/video/room/:roomSid         # Get room details
POST /api/video/room/:roomSid/complete # End video room
GET /api/video/room/:roomSid/participants # List room participants
POST /api/video/participant/:participantSid/disconnect # Disconnect participant
```

### Payment APIs (`/api/payments`)

```http
# Payment Management (Proxy to external service)
POST /api/payments/initiate          # Initiate payment for VDC services
POST /api/payments/verify-payment    # Verify payment signature
GET /api/payments/status/:payment_id # Get payment status
POST /api/payments/split/:payment_id # Release payment to doctor
GET /api/payments/transfer/:transfer_id # Get transfer status
GET /api/payments/linked-account/total-transfer # Get total transfers
POST /api/payments/refund/:payment_id # Request refund

# Legacy endpoints (deprecated)
POST /api/payment/create-order       # Use /api/payments/initiate instead
GET /api/payment/details/:paymentId  # Use /api/payments/status instead
```

### Queue Management APIs (`/api/queue`)

```http
POST /api/queue/join                 # Join doctor's queue
GET /api/queue/status/:doctorId      # Get queue status
POST /api/queue/leave                # Leave queue
GET /api/queue/position              # Get current position in queue
```

### Reports APIs (`/api/reports`)

```http
# Proxy to external reports service
GET /api/reports/consultations       # Get consultation reports
GET /api/reports/patients            # Get patient reports
GET /api/reports/doctors             # Get doctor reports
GET /api/reports/revenue             # Get revenue reports
```

---

## Authentication & Authorization

### JWT-based Authentication

The system uses JSON Web Tokens for stateless authentication:

```javascript
// Token structure
{
  id: "user_id",
  email: "user@example.com",
  role: "patient|doctor|admin",
  iat: timestamp,
  exp: timestamp
}
```

### Middleware

- **`authenticateToken`**: Validates JWT tokens
- **`auth`**: Enhanced authentication with user loading
- **Environment-based Auth**: Development mode allows bypassing auth

### User Roles

- **Patient**: Can book consultations, manage profile, join video calls
- **Doctor**: Can manage consultations, set VDC preferences, handle patient queue
- **Admin**: System administration capabilities

---

## Real-time Features

### Socket.IO Integration

Real-time communication powered by Socket.IO for:

#### Queue Management Events

```javascript
// Patient Events
'PATIENT_JOIN_QUEUE'; // Patient joins doctor's queue
'LEAVE_QUEUE'; // Patient leaves queue
'POSITION_UPDATE'; // Queue position updates

// Doctor Events
'START_CONSULTATION'; // Doctor starts consultation
'END_CONSULTATION'; // Doctor ends consultation
'QUEUE_CHANGED'; // Queue status updates

// Video Events
'PARTICIPANT_JOINED_ROOM'; // User joins video room
'PARTICIPANT_LEFT_ROOM'; // User leaves video room
'CONSULTATION_STARTED'; // Consultation begins
'CONSULTATION_ENDED'; // Consultation ends
```

#### Connection Management

```javascript
// Client connection with user type
const socket = io('server_url', {
  query: {
    userType: 'patient|doctor',
    userId: 'user_id',
  },
});
```

#### Real-time Updates

- **Queue Position**: Live updates of patient position in queue
- **Doctor Status**: Online/offline status changes
- **Consultation Flow**: Start/end consultation notifications
- **Video Room Management**: Participant tracking

---

## Payment System

### External Microservice Integration

The system integrates with an external payment microservice instead of direct payment processing:

#### Configuration

```env

```

#### Payment Flow

1. **Initiate Payment**: Client calls `/api/payments/initiate`
2. **Payment Processing**: Request proxied to external service
3. **Payment ID Returned**: Used for consultation booking
4. **Consultation Booking**: Include `paymentId` in booking request
5. **Payment Tracking**: Stored in consultation record

#### API Proxy Pattern

```javascript
// All payment requests are proxied to external service
app.use('/api/payments', (req, res) => {
  // Forward request to payment microservice
  // Handle response and errors
  // Maintain same API interface for clients
});
```

---

## File Management

### AWS S3 Integration

File uploads handled through AWS S3:

#### Upload Types

- **Doctor Profile Photos**: `/api/doctors/upload-profile-photo`
- **Medical Certificates**: `/api/doctors/upload-certificates`
- **Patient Documents**: Various patient-related document uploads

#### File Upload Utilities

```javascript
// src/utils/fileUpload.js
-uploadToS3() - // Generic S3 upload
  uploadDoctorProfilePhotoToS3() - // Doctor profile photos
  uploadDoctorDocumentToS3() - // Doctor certificates
  deleteFromS3(); // Delete files from S3
```

---

## Environment Configuration

### Required Environment Variables

```env
# Server Configuration
NODE_ENV=development|production
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=emedihub
DB_PORT=3306

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# External Services
PAYMENT_MICROSERVICE_URL=http://43.204.91.138:3000
FAMILY_API_BASE_URL=http://43.204.91.138:3000
REPORTS_API_BASE_URL=http://43.204.91.138:3000

# Patient Management (External microservice enabled)
# ENABLE_PATIENT_MICROSERVICE=true (always enabled)

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# Twilio Configuration
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_API_KEY=your-twilio-key
TWILIO_API_SECRET=your-twilio-secret

# Development/Testing
TEST_PATIENT_ID=default-patient-id
TEST_DOCTOR_ID=default-doctor-id
LOG_LEVEL=info|debug|error
```

### Configuration Modes

#### Patient Management

- **External Microservice**: All patient data and operations are handled by external patient API service

#### Environment-based Features

- **Production**: Full authentication required
- **Development**: Simplified auth with header-based user simulation

---

## Database Setup & Scripts

### Available Scripts

```bash
# Database Management
npm run sync-db           # Synchronize database schema
npm run seed              # Seed initial data
npm run fix-db            # Fix database issues
npm run fix-foreign-keys  # Fix foreign key constraints
npm run setup-microservice # Setup for microservice mode

# Development
npm start                 # Start production server
npm run dev              # Start development server with nodemon
npm run start-with-sync  # Start server with database sync
npm run test-socket      # Test socket functionality
```

### Database Synchronization

```javascript
// Patient data managed externally - no patient foreign key constraints
// System automatically configured for external patient microservice
await dropForeignKeyConstraints(); // Remove any patient-related FK constraints
```

### Seeding Data

```bash
# Seed with admin data
npm run seed -- admin

# Seed with simple data
npm run seed -- simple

# Custom seeding
node src/seeders/runSeeders.js
```

---

## Recent Major Changes

### 1. Payment System Migration (Latest)

- **Migrated** from internal Razorpay integration to external payment microservice
- **Maintained** backward compatibility with legacy endpoints
- **Added** `paymentId` field to consultation model for tracking
- **Implemented** proxy pattern for seamless external service integration

### 2. VDC (Video/Digital Consultation) Implementation

- **Added** VDC opt-in system for doctors
- **Separated** consultation settings from professional details
- **Implemented** VDC-specific APIs for fee and availability management
- **Enhanced** doctor listing APIs to respect VDC preferences

### 3. User ID Support for Family Consultations

- **Distinguished** between `userId` (platform owner) and `patientId` (consultation recipient)
- **Updated** PatientQueue model to support family member consultations
- **Enhanced** socket management for proper user tracking
- **Implemented** family member consultation workflows

### 4. Real-time Queue System

- **Implemented** Socket.IO-based video consultation queue
- **Added** real-time position updates and notifications
- **Created** PatientQueue model for queue management
- **Enhanced** consultation workflow with real-time events

---

## Deployment Guide

### Prerequisites

- Node.js 16+ and npm
- MySQL 8.0+
- AWS S3 bucket configured
- External payment microservice running

### Deployment Steps

1. **Clone Repository**

```bash
git clone <repository-url>
cd eMediHub-server-backend
```

2. **Install Dependencies**

```bash
npm install
```

3. **Environment Setup**

```bash
cp .env.example .env
# Configure all required environment variables
```

4. **Start Server**

```bash
# Production
npm start

# Development
npm run dev
```

5. **Verify Deployment**

- Server: `http://localhost:3000`
- API Documentation: `http://localhost:3000/api-docs`

### Production Considerations

- Use process manager (PM2) for production
- Set up reverse proxy (Nginx)
- Configure SSL certificates
- Enable proper logging and monitoring
- Set up database backups
- Configure environment-specific variables

---

---

## Admin APIs (Brief Overview)

The system includes comprehensive admin APIs for platform management:

### Admin Authentication

```http
POST /api/auth/register-admin    # Register admin user
POST /api/auth/login-admin       # Admin login
```

### Doctor Management

```http
GET /api/admin/doctors           # List all doctors
PUT /api/admin/doctors/:id/verify # Verify doctor profile
PUT /api/admin/doctors/:id/status # Update doctor status
```

### System Configuration

```http
GET /api/admin/settings          # Get system settings
PUT /api/admin/settings          # Update system configuration
```

### Content Management

```http
GET /api/admin/content           # Get CMS content
POST /api/admin/content          # Create content
PUT /api/admin/content/:id       # Update content
DELETE /api/admin/content/:id    # Delete content
```

### Analytics & Reports

```http
GET /api/admin/analytics/consultations # Consultation analytics
GET /api/admin/analytics/revenue       # Revenue analytics
GET /api/admin/analytics/doctors       # Doctor analytics
GET /api/admin/analytics/patients      # Patient analytics
```

### Specialization Management

```http
GET /api/admin/specializations    # List specializations
POST /api/admin/specializations   # Create specialization
PUT /api/admin/specializations/:id # Update specialization
DELETE /api/admin/specializations/:id # Delete specialization
```

Admin APIs provide comprehensive platform management capabilities but are not the primary focus of this handover as per requirements.

---

## Support and Maintenance

### Code Structure

- **Controllers**: Business logic in `src/controllers/`
- **Models**: Database models in `src/models/`
- **Routes**: API routes in `src/routes/`
- **Middleware**: Authentication and utilities in `src/middleware/`
- **Socket Handlers**: Real-time logic in `src/socket/`
- **Utilities**: Helper functions in `src/utils/`

### Best Practices

- Follow RESTful API design patterns
- Maintain comprehensive Swagger documentation
- Use proper error handling and logging
- Keep environment configurations secure
- Regular database backups and maintenance
- Monitor external service dependencies

### Documentation

- **API Documentation**: Available at `/api-docs` when server is running
- **Database Schema**: Defined in model files
- **Socket Events**: Documented in socket handler files
- **Environment Variables**: Listed in this document and README

---

**Document Version**: 1.0  
**Last Updated**: Current Date  
**Maintainer**: Development Team

This handover document provides comprehensive coverage of the eMediHub backend system. For specific implementation details, refer to the codebase and API documentation available at `/api-docs`.
