const { initializeApp } = require('firebase/app');
const { getAuth, signInWithCustomToken } = require('firebase/auth');
const admin = require('firebase-admin');
const axios = require('axios');
const { db, auth: adminAuth } = require('./config/firebaseAdmin');
require('dotenv').config({ path: './.env' });l̥

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testLogin() {
  try {
    console.log('Generating custom token...');
    const customToken = await adminAuth.createCustomToken('test-user-123', { email: 'test@example.com' });
    
    console.log('Signing in with custom token...');
    const userCredential = await signInWithCustomToken(auth, customToken);
    
    const idToken = await userCredential.user.getIdToken();
    console.log('Got ID token. Calling /api/auth/login...');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register/college', {
        institutionName: 'Test College Inc',
        contactPersonName: 'Admin',
        contactPhone: '1234567890'
      }, {
        headers: { Authorization: `Bearer ${idToken}` }
      });
      console.log('Register success:', response.data);
    } catch (e) {
      console.error('Register API error:', e.response?.status, e.response?.data);
    }

    process.exit(0);
  } catch (err) {
    console.error('Script error:', err);
    process.exit(1);
  }
}

testLogin();
