const mongoose = require('mongoose');
const env = require('./config/env');
const User = require('./models/User');

const seedAdmin = async () => {
  if (process.env.NODE_ENV === 'production') {
    console.error('[Seed Aborted] Cannot run seed script in production environment.');
    process.exit(1);
  }

  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log('[Seed] Connected to database');

    const adminEmail = 'admin@hirehub.com';
    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log(`[Seed] Admin user already exists: ${adminEmail}`);
    } else {
      admin = await User.create({
        full_name: 'Admin',
        email: adminEmail,
        password: 'SecureAdminPass1!',
        role: 'admin',
        is_verified: true,
        is_active: true,
      });
      console.log(`[Seed] Created default Admin user: ${adminEmail}`);
    }

    await mongoose.disconnect();
    console.log('[Seed] Disconnected. Seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
};

seedAdmin();
