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

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd emedihub-server-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a PostgreSQL database:
```bash
createdb emedihub_db
```

4. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the values in `.env` with your configuration

5. Start the development server:
```bash
npm run dev
```

The server will start on http://localhost:3000 (or the port specified in your .env file)

## API Documentation

Once the server is running, you can access the Swagger documentation at:
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
