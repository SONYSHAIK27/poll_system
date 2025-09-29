const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const Poll = require('./models/Poll');

const app = express();
const server = http.createServer(app);

// Configure CORS for Vercel deployment
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost')) return callback(null, true);
    
    // Allow all vercel.app domains
    if (origin.includes('vercel.app')) return callback(null, true);
    
    return callback(null, true); // Allow all for now
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
};

const io = socketIo(server, {
  cors: corsOptions,
  allowEIO3: true,
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

const PORT = process.env.PORT || 5000;
