// Simple test endpoint to verify Vercel deployment
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Test API endpoint is working',
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
