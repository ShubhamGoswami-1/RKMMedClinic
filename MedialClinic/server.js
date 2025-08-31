
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables before importing app
dotenv.config({ path: './.env' });

import app from './app.js';

// Set up database connection
const DB = process.env.DATABASE?.replace('<PASSWORD>', process.env.DATABASE_PASSWORD) || 'mongodb://localhost:27017/mediclinic';

// Connect to MongoDB
mongoose
  .connect(DB)
  .then(() => console.log('DB connection successful!'))
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

// Handle uncaught exceptions
// process.on('uncaughtException', err => {
//   console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
//   console.error(err.name, err.message);
//   process.exit(1);
// });

// Start server
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}...`);
});

// Handle unhandled rejections
// process.on('unhandledRejection', err => {
//   console.error('UNHANDLED REJECTION! 💥 Shutting down...');
//   console.error(err.name, err.message);
//   server.close(() => {
//     process.exit(1);
//   });
// });
