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
POST /api/auth/login             # Login patient
POST /api/auth/register-admin    # Register a new admin user
POST /api/auth/login-admin       # Login as admin
```

### Admin APIs (`/api/admin`)

```http
GET /api/admin/dashboard                            # Get admin dashboard statistics
GET /api/admin/doctors                              # List doctors (filterable)
PUT /api/admin/doctors/{id}                         # Update doctor's profile
PATCH /api/admin/doctors/{id}/verify                # Verify or unverify a doctor
GET /api/admin/patients                             # List patients
GET /api/admin/users                                # List users
PATCH /api/admin/patients/{id}/status               # Update patient active status
GET /api/admin/consultations                        # Get all consultations with filtering options
GET /api/admin/consultations/statistics             # Get consultation statistics
PATCH /api/admin/consultations/{id}                 # Update consultation status (cancel or reschedule)
GET /api/admin/consultations/report                 # Generate consultation report
GET /api/admin/analytics/patient-demographics       # Get patient demographics analysis
GET /api/admin/analytics/doctor-performance         # Get doctor performance metrics
GET /api/admin/analytics/system-usage               # Get system usage statistics
GET /api/admin/analytics/revenue-report             # Generate revenue report
GET /api/admin/settings                             # Get all system settings
POST /api/admin/settings                            # Update system settings
GET /api/admin/notification-templates               # Get notification templates
POST /api/admin/notification-templates              # Update notification template
POST /api/admin/fee-structure                       # Set fee structure
POST /api/admin/working-hours                       # Set working hours
GET /api/admin/specializations                      # Get all specializations
POST /api/admin/specializations                     # Create new specialization
GET /api/admin/specializations/{id}                 # Get specialization by ID
PUT /api/admin/specializations/{id}                 # Update specialization
DELETE /api/admin/specializations/{id}              # Delete specialization
GET /api/admin/specializations/{id}/doctors         # Get doctors by specialization
PATCH /api/admin/specializations/{id}/fee           # Set consultation fee for specialization
GET /api/admin/content                              # Get all content
POST /api/admin/content                             # Create new content
GET /api/admin/content/{idOrSlug}                   # Get content by ID or slug
PUT /api/admin/content/{id}                         # Update content
DELETE /api/admin/content/{id}                      # Delete content
POST /api/admin/content/faqs                        # Manage FAQs (update or reorder)
POST /api/admin/content/policies/{slug}             # Update policy
POST /api/admin/content/help/{slug}                 # Update help documentation
```

### Consultation APIs (`/api/consultation`)

```http
POST /api/consultation/startConsultation        # Start or rejoin a consultation
POST /api/consultation/checkStatus              # Check consultation/queue status (auto‑join support)
POST /api/consultation/rejoin                   # Rejoin ongoing consultation
POST /api/consultation/endConsultation          # End a consultation (doctor only)
```

### Consultation History APIs (`/api/consultation`)

```http
GET /api/consultation/doctor/{doctorId}/history       # Get consultation history for a doctor
GET /api/consultation/patient/{patientId}/history     # Get consultation history for a patient and their family
```

### Doctor APIs (`/api/doctors`)

```http
POST /api/doctors/register                             # Register a new doctor with phone number
POST /api/doctors/login                                # Login for existing doctor with phone number
POST /api/doctors/validate-otp                         # Validate OTP and authenticate doctor
POST /api/doctors/checkDoctorExists                    # Check if doctor exists by phone number
PUT /api/doctors/personal-details/{id}                 # Update doctor's personal details (supports profile photo upload)
PUT /api/doctors/professional-details/{id}             # Update doctor's professional details including certificates
DELETE /api/doctors/professional-details/{id}/certificate/{certificateIndex} # Delete a certificate from professional details
GET /api/doctors/profile                               # Get doctor's complete profile
PUT /api/doctors/verify-email                          # Legacy email verification endpoint (DEPRECATED)
GET /api/doctors                                       # Get all verified doctors with pagination and search
PUT /api/doctors/online-status                         # Update doctor's online status
GET /api/doctors/{id}/online-status                    # Get doctor's online status
GET /api/doctors/available                             # Get online and available doctors
GET /api/doctors/professional-details/{id}/certificates # Get doctor's current certificates
DELETE /api/doctors/delete-account                     # Delete own doctor account
GET /api/doctors/vdc-settings                          # Get doctor's VDC settings
PUT /api/doctors/vdc-settings                          # Update doctor's VDC settings
GET /api/doctors/vdc-status                            # Check if doctor has opted for VDC
GET /api/doctors/language                              # Get doctor's UI language preference
POST /api/doctors/language                             # Update doctor's UI language preference
POST /api/doctors/send-email-otp                       # Send OTP to doctor's email
POST /api/doctors/verify-email-otp                     # Verify email OTP
GET /api/doctors/email-verification-status/{doctorId}  # Get email verification status
POST /api/doctors/resend-email-otp                     # Resend email verification OTP
```

### Family APIs (`/api/family`)

```http
GET /api/family/view-family-tree                       # View user's family tree
POST /api/family/add-family-connection                 # Add a family member
POST /api/family/update-family-details/{familyMemberId} # Update family member details
DELETE /api/family/remove-member/{relatedUserId}       # Remove a family member
```

### Patient APIs (`/api/patients`)

```http
POST /api/patients/register-new                        # Register new patient
POST /api/patients/do-login                            # Login patient (send OTP)
POST /api/patients/validate-otp                        # Validate OTP for patient authentication
PUT /api/patients/record-personal-details              # Update patient's personal details
GET /api/patients/profile-details                      # Get patient's profile details
GET /api/patients/medical-details                      # Get patient's medical details
POST /api/patients/medical-details                     # Update patient's medical details
PUT /api/patients/email-verify                         # Verify patient's email
GET /api/patients/video-price                          # Get video consultation pricing
GET /api/patients/doctor-price/{doctorId}              # Get doctor's consultation price
DELETE /api/patients/do-delete-account                 # Delete patient account
POST /api/patients/checkUserExists                     # Check if patient exists by phone number
POST /api/patients/checkUserExist                      # Check if patient exists by phone (proxy)
GET /api/patients/settings/about                       # Get about page content (proxy)
GET /api/patients/settings/terms                       # Get terms page content (proxy)
POST /api/patients/language                            # Update preferred language (proxy)
```

### Patient Queue APIs (`/api/patientQueue`)

```http
GET /api/patientQueue/{doctorId}                       # Get patient queue for doctor
POST /api/patientQueue/join                            # Join patient queue
POST /api/patientQueue/leave                           # Leave patient queue
```

### Payment APIs (`/api/payments`)

```http
POST /api/payments/initiate                            # Initiate payment
POST /api/payments/verify-payment                      # Verify Razorpay payment
GET /api/payments/status/{payment_id}                  # Get status of payment
POST /api/payments/split/{payment_id}                  # Release payment to doctor
GET /api/payments/transfer/{transfer_id}               # Get transfer status
GET /api/payments/linked-account/total-transfer        # Get total transferred amount
POST /api/payments/refund/{payment_id}                 # Request refund
POST /api/payment/create-order                         # Create order (deprecated)
GET /api/payment/details/{paymentId}                   # Get payment details (deprecated)
```

### Report APIs (`/api/reports`)

```http
POST /api/reports/upload                               # Upload medical reports
GET /api/reports/view                                  # View medical reports
PUT /api/reports/edit/{report_id}                      # Edit medical report
DELETE /api/reports/delete/{report_id}                 # Delete medical report
GET /api/reports/download                              # Download merged reports
GET /api/reports/download/{report_id}                  # Download single report
```

### Video APIs (`/api/video`)

```http
POST /api/video/token                                  # Generate Twilio token
POST /api/video/room                                   # Create Twilio video room
GET /api/video/rooms                                   # List all video rooms
GET /api/video/room/{roomSid}                          # Get room details
POST /api/video/room/{roomSid}/complete                # End video room
GET /api/video/room/{roomSid}/participants             # List room participants
POST /api/video/room/{roomSid}/participant/{participantSid}/disconnect # Disconnect participant
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
