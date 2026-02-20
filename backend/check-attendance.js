require('dotenv').config();
const mongoose = require('mongoose');

async function checkAttendance() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Get ALL recent records (last 10) to avoid timezone issues
  const records = await mongoose.connection.db.collection('attendancerecords')
    .find({})
    .sort({ checkInAt: -1 })
    .limit(10)
    .toArray();

  console.log('\n📋 Recent Attendance Records (last 10):\n');

  if (records.length === 0) {
    console.log('   No records found in database at all.');
  } else {
    for (const r of records) {
      const checkIn = r.checkInAt ? new Date(r.checkInAt).toLocaleString() : '—';
      const checkOut = r.checkOutAt ? new Date(r.checkOutAt).toLocaleString() : '—';
      const recordDate = r.date ? new Date(r.date).toLocaleDateString() : '—';
      console.log(`   Date: ${recordDate}`);
      console.log(`   Status: ${r.status}`);
      console.log(`   Check In:  ${checkIn}`);
      console.log(`   Check Out: ${checkOut}`);
      console.log(`   Regular Hours: ${r.regularHours ?? '—'}`);
      console.log(`   OT Morning: ${r.overtimeHoursMorning ?? '—'}`);
      console.log(`   OT Evening: ${r.overtimeHoursEvening ?? '—'}`);
      console.log(`   Employee ID: ${r.employeeId}`);
      console.log(`   Workplace ID: ${r.workplaceId}`);
      console.log('   Full record:', JSON.stringify(r, null, 2));
      console.log('   ---');
    }
  }

  await mongoose.disconnect();
}

checkAttendance();
