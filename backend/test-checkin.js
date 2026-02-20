require('dotenv').config();
const axios = require('axios');

async function testCheckIn() {
  try {
    // First, login to get access token
    const loginRes = await axios.post('http://172.19.1.240:3000/api/auth/login', {
      email: 'admin@company.com',
      password: 'Admin1234!'
    });

    const accessToken = loginRes.data.accessToken;
    console.log('✅ Logged in successfully');

    // Now try check-in
    const checkinRes = await axios.post(
      'http://172.19.1.240:3000/api/attendance/checkin',
      {
        qrToken: '7510d4e4-4bf5-4cf7-8ff5-315eb2d41ded',
        deviceTimestamp: new Date().toISOString(),
        location: { lat: 6.9451, lng: 79.8627 }
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    console.log('✅ Check-in successful!');
    console.log('Response:', checkinRes.data);
  } catch (err) {
    console.error('❌ Error:', err.response?.data || err.message);
  }
}

testCheckIn();
