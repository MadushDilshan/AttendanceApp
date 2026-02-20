require('dotenv').config();
const mongoose = require('mongoose');

async function getToken() {
  await mongoose.connect(process.env.MONGODB_URI);
  const workplace = await mongoose.connection.db.collection('workplaces').findOne({ name: 'Main Office' });
  console.log('\n🔑 QR Code Token:', workplace.qrCodeToken);
  console.log('\nYou can generate a QR code at: https://www.qr-code-generator.com/');
  console.log('Enter this token as the text content.\n');
  await mongoose.disconnect();
}
getToken();
