// socket/socket.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { setupVideoQueueSocket } = require('./socketHandlers');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO to allow all origins
const io = new Server(server, {
  cors: {
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
  },
  transports: ['websocket', 'polling'],
  secure: true,
  rejectUnauthorized: false,
});

setupVideoQueueSocket(io);

module.exports = { app, server, io };
