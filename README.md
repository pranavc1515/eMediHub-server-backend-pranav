# eMediHub Server Backend

Backend server for eMediHub application - A comprehensive healthcare platform with video consultation capabilities.

## Features

- User Authentication (JWT-based)
- Doctor Management with VDC (Video/Digital Consultation) opt-in
- Patient Management (Internal DB or External Microservice)
- Video Consultation Queue System with Real-time Updates
- **Payment Processing via External Microservice**
- Prescription Management
- Real-time Socket.IO Communication
- File Upload (AWS S3 Integration)
- Comprehensive API Documentation (Swagger)

## Payment System

### Overview
The application now integrates with an external payment microservice instead of processing payments directly. All payment-related requests are proxied to the external service while maintaining the same API interface for clients.

### External Payment Microservice
- **Base URL**: `http://43.204.91.138:3000` (configurable via `PAYMENT_MICROSERVICE_URL` environment variable)
- **API Documentation**: Available at the external service endpoint

### Payment Integration Flow

1. **Payment Initiation**: 
   - Client initiates payment via `/api/payments/initiate`
   - Request is proxied to external microservice
   - Payment ID is returned to client

2. **Consultation Booking**:
   - When booking consultations, include `paymentId` in request body
   - Payment ID is stored in consultation record for tracking

3. **Payment Verification**:
   - Use `/api/payments/verify-payment` to verify completed payments
   - System can track payment status and handle refunds if needed

### API Endpoints

#### Payment Management
- `POST /api/payments/initiate` - Initiate a payment for VDC services
- `POST /api/payments/verify-payment` - Verify Razorpay payment signature
- `GET /api/payments/status/{payment_id}` - Get payment status
- `POST /api/payments/split/{payment_id}` - Release payment to doctor
- `GET /api/payments/transfer/{transfer_id}` - Get transfer status
- `GET /api/payments/linked-account/total-transfer` - Get total transfers
- `POST /api/payments/refund/{payment_id}` - Request refund and reverse transfer

#### Legacy Endpoints (Deprecated)
- `POST /api/payment/create-order` - Use `/api/payments/initiate` instead
- `GET /api/payment/details/{paymentId}` - Use `/api/payments/status/{payment_id}` instead

### Configuration

Set the payment microservice URL in your environment:
```env
PAYMENT_MICROSERVICE_URL=http://43.204.91.138:3000
```

If not set, defaults to `http://43.204.91.138:3000`.

### Consultation Payment Integration

When booking consultations, you can now include payment information:

```json
{
  "doctorId": 1,
  "scheduledDate": "2024-01-15",
  "startTime": "10:00:00",
  "endTime": "10:30:00",
  "notes": "Regular checkup",
  "paymentId": "order_QuqV1mRT1YoCB4"
}
```

The `paymentId` will be stored with the consultation record for tracking and potential refund scenarios.

## VDC (Video/Digital Consultation) System

Doctors can opt-in to provide video consultation services:
- Enable/disable VDC services
- Set consultation fees
- Configure availability
- Manage time slots

## Real-time Features

- Video consultation queue management
- Live queue position updates
- Socket.IO-based communication
- Real-time notifications

## API Documentation

Access comprehensive API documentation at `/api-docs` when the server is running.

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database synchronization: `npm run sync-db`
5. Start the server: `npm start`

## Environment Variables

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=password
DB_NAME=emedihub
JWT_SECRET=your-secret-key
PAYMENT_MICROSERVICE_URL=http://43.204.91.138:3000
ENABLE_PATIENT_MICROSERVICE=false
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## Database Setup

The application supports both internal patient management and external patient microservice integration.

### Scripts
- `npm run sync-db` - Synchronize database schema
- `npm run seed` - Seed initial data
- `npm run fix-db` - Fix database issues
- `npm run fix-foreign-keys` - Fix foreign key constraints

## Development

- `npm run dev` - Start development server with nodemon
- `npm run test-socket` - Test socket functionality

## Architecture

The application follows a microservice-friendly architecture:
- **Payment Processing**: External microservice integration
- **Patient Management**: Configurable (internal DB or external API)
- **Doctor Management**: Internal with VDC opt-in system
- **Real-time Communication**: Socket.IO based
- **File Storage**: AWS S3 integration

## Security

- JWT-based authentication
- Request validation and sanitization
- Environment-based configuration
- Secure payment proxy implementation
