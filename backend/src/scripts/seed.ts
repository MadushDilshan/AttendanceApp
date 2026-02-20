/**
 * Seed script — creates the initial Workplace and admin Employee.
 * Run: npm run seed
 * Safe to re-run — skips if records already exist.
 */
import { v4 as uuidv4 } from 'uuid';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Workplace } from '../models/Workplace';
import { Employee } from '../models/Employee';
import { hashPassword } from '../services/auth.service';

async function seed(): Promise<void> {
  await connectDatabase();

  // Workplace
  let workplace = await Workplace.findOne();
  if (!workplace) {
    workplace = await Workplace.create({
      name: 'Main Office',
      location: {
        type: 'Point',
        coordinates: [80.0, 7.0], // [lng, lat] — REPLACE with your actual coordinates
      },
      geofenceRadiusMetres: 100,
      qrCodeToken: uuidv4(),
    });
    console.warn(`✅ Workplace created: ${workplace.name}`);
    console.warn(`   QR Token: ${workplace.qrCodeToken}`);
    console.warn('   ⚠️  Update coordinates in Settings before going live!');
  } else {
    console.warn(`ℹ️  Workplace already exists: ${workplace.name}`);
  }

  // Admin employee
  const adminEmail = 'admin@company.com';
  let admin = await Employee.findOne({ email: adminEmail });
  if (!admin) {
    const passwordHash = await hashPassword('Admin1234!');
    admin = await Employee.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash,
      role: 'admin',
      status: 'active',
    });
    console.warn(`✅ Admin created: ${admin.email} / Admin1234!`);
    console.warn('   ⚠️  Change password immediately after first login!');
  } else {
    console.warn(`ℹ️  Admin already exists: ${admin.email}`);
  }

  await disconnectDatabase();
  console.warn('✅ Seed complete');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
