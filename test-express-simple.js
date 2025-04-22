// Simple Express test with minimal dependencies
import express from 'express';

console.log(`Node.js version: ${process.version}`);

const app = express();
console.log('Express initialized successfully');

app.get('/', (req, res) => {
  res.send('Hello from Express 5');
});

// Use plain Node.js HTTP server instead of Express convenience methods
const server = app.listen(3001, () => {
  console.log('Server listening on port 3001');
  
  // Exit after 1 second to avoid indefinite running in Replit
  setTimeout(() => {
    console.log('Test completed successfully');
    server.close();
    process.exit(0);
  }, 1000);
});