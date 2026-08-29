import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Add a new document to a specified Firestore collection (Auto-generated Document ID)
 * @param {string} collectionName - e.g., 'students', 'courses', 'users'
 * @param {object} data - Object data to store
 * @returns {Promise<{id: string, ...data}>}
 */
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`🔥 [Firestore] Document added to ${collectionName} with ID:`, docRef.id);
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`❌ [Firestore Error] Failed to add document to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Create or overwrite a document with a specific Document ID
 * @param {string} collectionName - e.g., 'users'
 * @param {string} docId - Custom ID (e.g. user.uid)
 * @param {object} data - Object data to store
 */
export const setDocument = async (collectionName, docId, data) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
    console.log(`🔥 [Firestore] Document set for ${collectionName}/${docId}`);
    return { id: docId, ...data };
  } catch (error) {
    console.error(`❌ [Firestore Error] Failed to set document ${collectionName}/${docId}:`, error);
    throw error;
  }
};

/**
 * Fetch a single document by collection name and document ID
 * @param {string} collectionName 
 * @param {string} docId 
 */
export const getDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.warn(`⚠️ [Firestore] No document found at ${collectionName}/${docId}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ [Firestore Error] Failed to get document ${collectionName}/${docId}:`, error);
    throw error;
  }
};

/**
 * Fetch all documents from a collection with optional query conditions
 * @param {string} collectionName 
 * @param {Array} constraints - Optional array of query constraints e.g. [where("role", "==", "student")]
 */
export const getCollectionData = async (collectionName, constraints = []) => {
  try {
    const colRef = collection(db, collectionName);
    const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
    const querySnapshot = await getDocs(q);
    const results = [];
    querySnapshot.forEach((docSnap) => {
      results.push({ id: docSnap.id, ...docSnap.data() });
    });
    return results;
  } catch (error) {
    if (error.code !== 'permission-denied') {
      console.error(`❌ [Firestore Error] Failed to fetch collection ${collectionName}:`, error);
    }
    throw error;
  }
};

/**
 * Update specific fields of an existing document
 * @param {string} collectionName 
 * @param {string} docId 
 * @param {object} updateData 
 */
export const updateDocument = async (collectionName, docId, updateData) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    console.log(`🔥 [Firestore] Updated document ${collectionName}/${docId}`);
  } catch (error) {
    console.error(`❌ [Firestore Error] Failed to update ${collectionName}/${docId}:`, error);
    throw error;
  }
};

/**
 * Delete a document from Firestore
 * @param {string} collectionName 
 * @param {string} docId 
 */
export const deleteDocument = async (collectionName, docId) => {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
    console.log(`🔥 [Firestore] Deleted document ${collectionName}/${docId}`);
  } catch (error) {
    console.error(`❌ [Firestore Error] Failed to delete ${collectionName}/${docId}:`, error);
    throw error;
  }
};

/**
 * Subscribe to realtime updates for a collection
 * @param {string} collectionName 
 * @param {function} callback - Called whenever collection data updates
 */
export const subscribeToCollection = (collectionName, callback) => {
  const colRef = collection(db, collectionName);
  return onSnapshot(colRef, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(items);
  }, (error) => {
    console.error(`❌ [Firestore Realtime Error] ${collectionName}:`, error);
  });
};
