#!/usr/bin/env node

// Start script for Replit - runs the video-to-lofi transformation server
import { spawn } from 'child_process';

console.log('Starting video-to-lofi transformation server...');

const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
  }
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.kill('SIGTERM');
});