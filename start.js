/**
 * Startup script for eMediHub server
 * This script will:
 * 1. Sync the database (create tables if they don't exist)
 * 2. Start the server
 */

const { spawn, execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting eMediHub Server...');

try {
  // First, sync the database
  console.log('🔄 Syncing database tables...');
  execSync('node src/syncDatabase.js', { stdio: 'inherit' });
  
  // Then start the server
  console.log('✅ Database sync complete');
  console.log('🔌 Starting server...');
  
  const server = spawn('node', ['src/server.js'], { 
    stdio: 'inherit',
    shell: true
  });
  
  server.on('close', (code) => {
    if (code !== 0) {
      console.log(`❌ Server process exited with code ${code}`);
    }
  });
  
  // Handle script termination
  process.on('SIGINT', () => {
    console.log('👋 Shutting down server...');
    server.kill('SIGINT');
  });
  
} catch (error) {
  console.error('❌ Error during startup:', error.message);
  process.exit(1);
} 