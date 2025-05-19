const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');

// Import socket handler
const setupVideoQueueSocket = require('./socket/videoQueue.socket');

// Load environment variables
dotenv.config();

// Import database connection
const db = require('./config/database');

// Import models to ensure they're initialized
require('./models/patient.model');
require('./models/patientIN.model');
require('./models/doctor.model');
require('./models/consultation.model');
require('./models/patientQueue.model');
require('./models/prescription.model');

// Import routes
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const patientINRoutes = require('./routes/patientIN.routes');
const doctorRoutes = require('./routes/doctor.routes');
const adminRoutes = require('./routes/admin.routes');
const videoRoutes = require('./routes/video.routes');
const patientConsultationRoutes = require('./routes/patient/consultation.routes');
const doctorConsultationRoutes = require('./routes/doctor/consultation.routes');
const paymentRoutes = require('./routes/payment.routes');
const prescriptionRoutes = require('./routes/prescription.routes');

const app = express();
const server = http.createServer(app);

// Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

// Socket.io setup with improved CORS
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Setup socket handlers
setupVideoQueueSocket(io);

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  })
);

// Additional headers for CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );
  res.header('Access-Control-Allow-Credentials', true);

  // Handle OPTIONS method
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'eMediHub API Documentation',
      version: '1.0.0',
      description: 'API documentation for eMediHub backend services',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/routes/*/*.js'], // Path to the API routes, including nested routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', authRoutes);

// Use either 3rd party API implementation or internal database implementation for patient routes
// To switch between implementations, change the USE_INTERNAL_PATIENT_DB environment variable
// or modify the value below.

const useInternalPatientDb = process.env.USE_INTERNAL_PATIENT_DB === 'true';

// if (useInternalPatientDb) {
// Use internal database implementation
console.log('Using internal patient database implementation');
app.use('/api/patients', patientINRoutes);
// } else {
// Use 3rd party API implementation
//   console.log('Using 3rd party API patient implementation');
//   app.use('/api/patients', patientRoutes);
// }

// Alternatively, comment out the if-else above and uncomment one of these lines:
// app.use('/api/patients', patientRoutes);    // Use 3rd party API implementation
// app.use('/api/patients', patientINRoutes);  // Use internal database implementation

app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/consultation', patientConsultationRoutes);
app.use('/api/doctor', doctorConsultationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;

// Database connection and server start
db.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    // Sync all models
    return db.sync(); // <- this creates tables if they don't exist
  })
  .then(() => {
    console.log('Database models synchronized successfully.');
    // Start the server after DB and model sync
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
      console.log(`Socket.io initialized and ready`);
    });
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });
