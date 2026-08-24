const mongoose = require('mongoose');
const env = require('./config/env');
const User = require('./models/User');

const DEFAULT_ADMIN_PASSWORD = 'Password123!';

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
    let admin = await User.findOne({ email: adminEmail }).select('+password');

    if (admin) {
      // Reset password to unified default if it differs (fixes old seed mismatch)
      if (admin.password) {
        const bcrypt = require('bcryptjs');
        const matches = await bcrypt.compare(DEFAULT_ADMIN_PASSWORD, admin.password);
        if (!matches) {
          admin.password = DEFAULT_ADMIN_PASSWORD;
          await admin.save();
          console.log(`[Seed] Reset admin password to unified default: ${DEFAULT_ADMIN_PASSWORD}`);
        }
      }
      console.log(`[Seed] Admin user already exists: ${adminEmail}`);
    } else {
      admin = await User.create({
        full_name: 'System Administrator',
        email: adminEmail,
        password: DEFAULT_ADMIN_PASSWORD,
        role: 'admin',
        is_verified: true,
        is_active: true,
      });
      console.log(`[Seed] Created default Admin user: ${adminEmail} / ${DEFAULT_ADMIN_PASSWORD}`);
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
