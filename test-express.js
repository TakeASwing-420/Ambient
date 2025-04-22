// Test script to verify Express with Node.js 22
import express from 'express';
import { createServer } from 'http';

// Log Node.js version
console.log(`Node.js version: ${process.version}`);

// Test Express
const app = express();
console.log('Express initialized successfully');

// Add a simple route
app.get('/', (req, res) => {
  res.send('Hello World from Express 5!');
});

// Test HTTP server creation
const server = createServer(app);
console.log('HTTP server created successfully');

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});