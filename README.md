# eMediHub Server Backend

A Node.js backend server for the eMediHub application with PostgreSQL database and Swagger documentation.

## Features

- User authentication and authorization
- PostgreSQL database with Sequelize ORM
- Swagger API documentation
- JWT-based authentication
- Role-based access control
- Error handling and logging
- Environment configuration

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure your environment variables in `.env` file:

   ```
   DB_NAME=emedihub
   DB_USER=your-db-username
   DB_PASSWORD=your-db-password
   DB_HOST=localhost
   DB_PORT=3306
   PORT=3000
   ```

4. Sync the database tables (creates PatientQueue and other tables if they don't exist):

   ```
   npm run sync-db
   ```

5. Start the server:
   ```
   npm start
   ```
   Or for development with auto-restart:
   ```
   npm run dev
   ```

## PatientQueue Model

The PatientQueue model has been simplified with the following fields:

| Field                 | Description                                        |
| --------------------- | -------------------------------------------------- |
| id                    | Primary key (UUID)                                 |
| patientId             | Foreign key to Patient                             |
| doctorId              | Foreign key to Doctor                              |
| status                | ENUM: waiting, in_consultation, done, left         |
| joinedAt              | Used for queue position calculation                |
| roomName              | Room name for video chat                           |
| socketId              | For real-time tracking                             |
| consultationId        | Link to consultation (when created)                |
| priority              | For urgent cases (higher number = higher priority) |
| hasJoinedRoom         | True if patient entered room                       |
| consultationStartedAt | Track time consultation begins                     |

Position and wait time are now calculated dynamically based on joinedAt and priority.

## Troubleshooting

If you encounter the error "Table 'emedihub.patientqueues' doesn't exist", run:

```
npm run sync-db
```

This will create all necessary tables in the database.

## API Documentation

Access the API documentation at:

```
http://localhost:3000/api-docs
```

## Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot reload

## Project Structure

```
src/
├── config/         # Configuration files
├── middleware/     # Custom middleware
├── models/         # Database models
├── routes/         # API routes
└── server.js       # Main application file
```

## API Endpoints

### Authentication

- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Users

- GET /api/users/profile - Get user profile (authenticated)
- GET /api/users - Get all users (admin only)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the ISC License. "# eMediHub-server-backend-pranav"
