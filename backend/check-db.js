require('dotenv').config();
const mongoose = require('mongoose');

async function checkDB() {
  await mongoose.connect(process.env.MONGODB_URI);

  // List all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('\n📦 Collections in database:');
  for (const col of collections) {
    const count = await mongoose.connection.db.collection(col.name).countDocuments();
    console.log(`   ${col.name}: ${count} documents`);
  }

  // Check if attendancerecords collection exists (might be named differently)
  const attendanceVariants = ['attendances', 'attendancerecords', 'attendance'];
  for (const name of attendanceVariants) {
    try {
      const count = await mongoose.connection.db.collection(name).countDocuments();
      if (count > 0) {
        console.log(`\n✅ Found ${count} records in '${name}' collection`);
        const sample = await mongoose.connection.db.collection(name).findOne();
        console.log('Sample record:', JSON.stringify(sample, null, 2));
      }
    } catch (e) {
      // Collection doesn't exist
    }
  }

  await mongoose.disconnect();
}

checkDB();
