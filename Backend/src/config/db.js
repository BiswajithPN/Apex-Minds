const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore DNS config error if restricted
}

const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  const primaryUri = env.MONGO_URI || 'mongodb://127.0.0.1:27017/hirehub';
  const fallbackUri = 'mongodb://127.0.0.1:27017/hirehub';

  const mongoOptions = {
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    maxPoolSize: 50,        // handle up to 50 concurrent DB operations
    minPoolSize: 5,         // keep 5 connections always warm
    maxIdleTimeMS: 30000,   // close idle connections after 30s
    compressors: 'zlib',    // compress data between app and MongoDB
    heartbeatFrequencyMS: 10000,
  };

  try {
    console.log(`[MongoDB] Connecting to database...`);
    const conn = await mongoose.connect(primaryUri, mongoOptions);
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    await autoSeedIfEmpty();
  } catch (error) {
    console.warn(`[MongoDB Warning] Primary connection (${primaryUri}) failed: ${error.message}`);

    if (primaryUri !== fallbackUri) {
      try {
        console.log(`[MongoDB] Attempting fallback to local instance: ${fallbackUri}...`);
        const fallbackConn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          maxPoolSize: 10,
          minPoolSize: 2,
        });
        console.log(`[MongoDB] Fallback connected to: ${fallbackConn.connection.host}/${fallbackConn.connection.name}`);
        await autoSeedIfEmpty();
      } catch (fallbackError) {
        console.error(`[MongoDB Fatal Error] Fallback connection failed: ${fallbackError.message}`);
      }
    }
  }
};

/**
 * Auto-seed basic sample accounts and jobs if the database is brand new/empty
 */
async function autoSeedIfEmpty() {
  try {
    const User = require('../models/User');
    const Job = require('../models/Job');
    const userCount = await User.countDocuments();

    if (userCount === 0) {
      console.log('[MongoDB Seed] Database is empty. Creating default demo accounts...');

      // 1. Admin
      await User.create({
        full_name: 'System Administrator',
        email: 'admin@hirehub.com',
        password: 'Password123!',
        role: 'admin',
        is_verified: true,
        is_active: true,
      });

      // 2. Employer
      const employer = await User.create({
        full_name: 'SVS Agencies',
        email: 'employer@gmail.com',
        password: 'Password123!',
        role: 'employer',
        is_verified: true,
        is_active: true,
      });

      // 3. Job Seeker
      await User.create({
        full_name: 'Job Seeker',
        email: 'jobseeker@gmail.com',
        password: 'Password123!',
        role: 'jobseeker',
        is_verified: true,
        is_active: true,
      });

      // 4. Sample Jobs
      await Job.create([
        {
          employerId: employer._id,
          title: 'Senior Full Stack Engineer',
          company: 'SVS Agencies',
          location: 'Remote',
          type: 'Full-time',
          salary: '$120,000 - $150,000',
          description: 'Looking for an experienced Full Stack Engineer with React and Node.js skills.',
          requirements: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
          status: 'open',
          flagged: false,
        },
        {
          employerId: employer._id,
          title: 'AI / ML Engineer',
          company: 'SVS Agencies',
          location: 'Hybrid',
          type: 'Full-time',
          salary: '$140,000 - $170,000',
          description: 'Building explainable multi-criteria candidate ranking models.',
          requirements: ['Python', 'PyTorch', 'NLP', 'Scikit-learn'],
          status: 'open',
          flagged: false,
        },
      ]);

      console.log('[MongoDB Seed] Demo accounts and jobs successfully created on MongoDB Atlas!');
    }
  } catch (err) {
    console.error('[MongoDB Seed Error]', err.message);
  }
}

module.exports = connectDB;
