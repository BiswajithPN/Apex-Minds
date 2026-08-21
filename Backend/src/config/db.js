const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  const primaryUri = env.MONGO_URI || 'mongodb://127.0.0.1:27017/hirehub';
  const fallbackUri = 'mongodb://127.0.0.1:27017/hirehub';

  try {
    console.log(`[MongoDB] Connecting to database...`);
    const conn = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 3000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
    await autoSeedIfEmpty();
  } catch (error) {
    console.warn(`[MongoDB Warning] Primary connection (${primaryUri}) failed: ${error.message}`);
    
    if (primaryUri !== fallbackUri) {
      try {
        console.log(`[MongoDB] Attempting fallback to local instance: ${fallbackUri}...`);
        const fallbackConn = await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 3000,
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
        full_name: 'Admin User',
        email: 'admin@hirehub.com',
        password: 'Password123!',
        role: 'admin',
        is_verified: true,
        is_active: true,
      });

      // 2. Employer
      const employer = await User.create({
        full_name: 'Tech Recruiter',
        email: 'employer@hirehub.com',
        password: 'Password123!',
        role: 'employer',
        is_verified: true,
        is_active: true,
      });

      // 3. Job Seeker
      await User.create({
        full_name: 'Alex Developer',
        email: 'jobseeker@hirehub.com',
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
          description: 'Looking for an experienced engineer to architect scalable web apps using React, Node.js, and MongoDB.',
          skills_required: ['React', 'Node.js', 'MongoDB', 'Express', 'TypeScript', 'Docker', 'AWS'],
          job_type: 'full-time',
          location: 'San Francisco, CA (Hybrid)',
          salary: '$140,000 - $175,000',
          experience_level: 'senior',
          status: 'open',
        },
        {
          employerId: employer._id,
          title: 'Frontend React Developer',
          description: 'Build performant, responsive user interfaces and interactive dashboards.',
          skills_required: ['React', 'JavaScript', 'Tailwind', 'HTML', 'CSS', 'Redux', 'Git'],
          job_type: 'full-time',
          location: 'Remote',
          salary: '$110,000 - $135,000',
          experience_level: 'mid',
          status: 'open',
        },
      ]);

      console.log('[MongoDB Seed] Seeded default users: admin@hirehub.com, employer@hirehub.com, jobseeker@hirehub.com (Password: Password123!)');
    }
  } catch (err) {
    console.error('[MongoDB Seed Error]', err.message);
  }
}

// Connection lifecycle
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB Warning] Disconnected from database.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB Info] Reconnected to database.');
});

mongoose.connection.on('error', (err) => {
  console.error(`[MongoDB Error] Runtime connection error: ${err.message}`);
});

module.exports = connectDB;
