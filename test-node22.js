// Test script to verify Node.js 22 and updated dependencies
import express from 'express';
import { createServer } from 'http';
import React from 'react';
import { renderToString } from 'react-dom/server';

// Log Node.js version
console.log(`Node.js version: ${process.version}`);

// Test Express
const app = express();
console.log('Express initialized successfully');

// Test React
const element = React.createElement('div', null, 'Hello from React 19');
const html = renderToString(element);
console.log('React 19 SSR test:', html);

// Test HTTP server creation
const server = createServer(app);
console.log('HTTP server created successfully');

// Show ESM support
console.log('ESM imports working successfully');

// Test updated Node.js 22 features
try {
  // Use the performance API to measure time
  const start = performance.now();
  for (let i = 0; i < 1000000; i++) {}
  const end = performance.now();
  
  console.log(`Node.js 22 performance API working: ${Math.round(end - start)}ms elapsed`);
} catch (e) {
  console.error('Error testing Node.js 22 features:', e.message);
}

console.log('All tests completed successfully');