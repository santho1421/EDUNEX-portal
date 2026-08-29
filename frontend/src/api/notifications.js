import { db } from '../config/firebase';
import { collection, query, where, addDoc, onSnapshot, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

// Send a notification to a user
export const sendNotification = async (userId, message, type = 'info', meta = {}) => {
  if (!userId) return;
  const ref = collection(db, 'notifications');
  await addDoc(ref, {
    userId,
    message,
    type,
    meta,
    read: false,
    createdAt: serverTimestamp()
  });
};

// Get all notifications for current user (one-time)
export const getNotifications = async (userId) => {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

// Real-time subscription to user notifications
export const subscribeNotifications = (userId, callback) => {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId));
  return onSnapshot(q, (snap) => {
    const items = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    callback(items);
  });
};

// Mark a notification as read
export const markNotificationRead = async (notificationId) => {
  const ref = doc(db, 'notifications', notificationId);
  await updateDoc(ref, { read: true });
};

// Mark all as read
export const markAllNotificationsRead = async (userId) => {
  const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false));
  const snap = await getDocs(q);
  const updates = snap.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { read: true }));
  await Promise.all(updates);
};
