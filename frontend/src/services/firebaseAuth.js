import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in user with Firebase Email and Password
 * @param {string} email 
 * @param {string} password 
 */
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Fetch user role & profile from Firestore
    let userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || email.split('@')[0],
      role: 'student', // default
      photoURL: firebaseUser.photoURL || null
    };

    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        userData = { ...userData, ...userSnap.data() };
      } else {
        // Create user document if missing
        await setDoc(userDocRef, {
          ...userData,
          createdAt: serverTimestamp()
        });
      }
    } catch (dbErr) {
      console.warn("⚠️ Could not fetch Firestore user doc, using auth data:", dbErr);
    }

    const token = await firebaseUser.getIdToken();
    return { token, user: userData };
  } catch (error) {
    console.error("❌ [Firebase Auth] Login error:", error.code, error.message);
    throw error;
  }
};

/**
 * Register a new user with Firebase Email and Password
 * @param {object} param0 { email, password, first_name, last_name, name, role }
 */
export const registerWithEmailAndPassword = async ({ email, password, first_name = '', last_name = '', name = '', role = 'student' }) => {
  try {
    const displayName = name || `${first_name} ${last_name}`.trim() || email.split('@')[0];
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Update Firebase Auth Display Name
    await updateProfile(firebaseUser, { displayName });

    const userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: displayName,
      first_name,
      last_name,
      role,
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Store profile in Firestore
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, userData);
    } catch (dbErr) {
      console.warn("⚠️ Firestore write warning during signup:", dbErr);
    }

    const token = await firebaseUser.getIdToken();
    return { token, user: userData };
  } catch (error) {
    console.error("❌ [Firebase Auth] Signup error:", error.code, error.message);
    throw error;
  }
};

/**
 * Sign in / Register with Google Provider
 * @param {string} role - 'student' | 'college' | 'industry'
 */
export const loginWithGoogle = async (role = 'student') => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;

    const userDocRef = doc(db, "users", firebaseUser.uid);
    let userData = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      photoURL: firebaseUser.photoURL || null,
      role: role
    };

    try {
      const userSnap = await getDoc(userDocRef);
      if (userSnap.exists()) {
        const existingData = userSnap.data();
        userData = { ...userData, ...existingData };
      } else {
        // Save new user from Google Sign In
        await setDoc(userDocRef, {
          ...userData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (dbErr) {
      console.warn("⚠️ Firestore read/write warning during Google Sign In:", dbErr);
    }

    const token = await firebaseUser.getIdToken();
    return { token, user: userData };
  } catch (error) {
    console.error("❌ [Firebase Auth] Google Sign-In error:", error.code, error.message);
    throw error;
  }
};

/**
 * Sign out current user
 */
export const logoutFirebase = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("❌ [Firebase Auth] Logout error:", error);
  }
};

/**
 * Format Firebase error messages for user toast notifications
 * @param {object} error 
 */
export const getFirebaseErrorMessage = (error) => {
  if (!error?.code) return error?.message || 'Authentication failed.';
  switch (error.code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered. Please sign in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in popup was closed before completing.';
    case 'auth/operation-not-allowed':
      return 'Email/Password or Google sign-in is not enabled in Firebase Console.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    default:
      return error.message || 'Authentication error occurred.';
  }
};
