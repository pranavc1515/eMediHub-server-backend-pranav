// socket/socket.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { setupVideoQueueSocket } = require('./socketHandlers');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://128.199.26.111:5173',
  'http://128.199.26.111:3000',
  'https://128.199.26.111:5173',
  'https://128.199.26.111:3000',
];

const io = new Server(server, {
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
  secure: true,
  rejectUnauthorized: false,
});

setupVideoQueueSocket(io);

module.exports = { app, server, io };
