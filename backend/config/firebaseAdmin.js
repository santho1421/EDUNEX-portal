const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
const fs = require('fs');

let db = null;
let auth = null;

try {
  // Avoid re-initializing if already done (e.g., hot reload)
  if (getApps().length === 0) {
    let credential;

    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

    if (fs.existsSync(serviceAccountPath)) {
      // Local development — use the JSON file
      const serviceAccount = require(serviceAccountPath);
      credential = cert(serviceAccount);
      console.log('✅ Firebase Admin: using serviceAccountKey.json');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Production (Render/Vercel) — use environment variables
      credential = cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace escaped newlines from env var format
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : undefined,
      });
      console.log('✅ Firebase Admin: using environment variables');
    } else {
      throw new Error(
        'No Firebase credentials found. Provide serviceAccountKey.json or FIREBASE_PROJECT_ID env var.'
      );
    }

    const app = initializeApp({ credential });
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    // Already initialized — get existing instances
    const { getApp } = require('firebase-admin/app');
    db = getFirestore(getApp());
    auth = getAuth(getApp());
  }
} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  console.error('   Backend API calls requiring Firestore will fail until credentials are set.');
}

module.exports = { db, auth };
