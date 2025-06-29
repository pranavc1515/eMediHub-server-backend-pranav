// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');

// Load environment variables
dotenv.config();

const { app, server } = require('./socket/socket');
const db = require('./config/database');
const ENABLE_PATIENT_MICROSERVICE = process.env.ENABLE_PATIENT_MICROSERVICE;

// Load models
require('./models/patient.model');
// Always load PatientIN model (still needed for conditional use)
require('./models/patientIN.model');
require('./models/doctor.model');
require('./models/consultation.model');
require('./models/patientQueue.model');
require('./models/prescription.model');
require('./models/user.model');

// Load routes
const authRoutes = require('./routes/auth.routes');
const patientINRoutes = require('./routes/patientIN.routes');

// Conditionally load patient routes based on microservice flag
let patientRoutes;
if (ENABLE_PATIENT_MICROSERVICE) {
  patientRoutes = require('./routes/patient.routes');
}
const doctorRoutes = require('./routes/doctor.routes');
const adminRoutes = require('./routes/admin.routes');
const videoRoutes = require('./routes/video.routes');
const consultationRoutes = require('./routes/consultation.routes');
const paymentRoutes = require('./routes/payment.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const patientQueueRoutes = require('./routes/patientQueue.routes');
const reportsRoutes = require('./routes/reports.routes');

// Configure CORS to allow all origins
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
    ],
    credentials: true,
    maxAge: 86400,
  })
);

// Additional headers for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );
  res.header('Access-Control-Allow-Credentials', true);
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'eMediHub API Documentation',
      version: '1.0.0',
      description: 'API documentation for eMediHub backend services',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3000}` }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/routes/*/*.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/auth', authRoutes);
if (ENABLE_PATIENT_MICROSERVICE) {
  console.log('Using 3rd party API patient implementation');
  app.use('/api/patients', patientRoutes);
} else {
  console.log('Using internal patient database implementation');
  app.use('/api/patients', patientINRoutes);
}
app.use('/api/doctors', doctorRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/consultation', consultationRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/patientQueue', patientQueueRoutes);
app.use('/api/reports', reportsRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3000;

// Import foreign key constraint migration functions
const { dropForeignKeyConstraints, addForeignKeyConstraints } = require('../fix-foreign-key-constraints');

db.authenticate()
  .then(() => {
    console.log('Database connected successfully.');
    return db.sync();
  })
  .then(async () => {
    console.log('Models synchronized.');

    // Handle foreign key constraints based on microservice mode
    try {
      if (ENABLE_PATIENT_MICROSERVICE === 'true') {
        console.log('🔧 Microservice mode detected - removing patient foreign key constraints...');
        await dropForeignKeyConstraints();
      } else {
        console.log('🔧 Internal mode detected - ensuring patient foreign key constraints exist...');
        await addForeignKeyConstraints();
      }
    } catch (error) {
      console.warn('⚠️  Warning: Foreign key constraint migration failed:', error.message);
      console.log('🚀 Continuing server startup...');
    }

    server.listen(PORT, () => {
      console.log(`Server listening on http://localhost:${PORT}`);
      console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
      console.log(`Patient Mode: ${ENABLE_PATIENT_MICROSERVICE === 'true' ? 'Microservice (External API)' : 'Internal Database'}`);
    });
  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
