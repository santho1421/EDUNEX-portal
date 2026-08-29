const { db, auth } = require('./backend/config/firebaseAdmin');

async function test() {
  try {
    console.log('Testing Firestore connection...');
    const snapshot = await db.collection('users').limit(1).get();
    console.log('Firestore connected. Found users:', snapshot.size);
    process.exit(0);
  } catch (e) {
    console.error('Error connecting to Firestore:', e);
    process.exit(1);
  }
}

test();
