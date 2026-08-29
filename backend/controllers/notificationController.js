const db = require('../config/firebaseAdmin');

// GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const { unread_only, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM notifications WHERE user_id=?';
    const params = [req.user.id];
    if (unread_only === 'true') { query += ' AND is_read=0'; }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);
    const [notifications] = await db.execute(query, params);
    const [countRow] = await db.execute('SELECT COUNT(*) as count FROM notifications WHERE user_id=? AND is_read=0', [req.user.id]);
    res.json({ success: true, data: notifications, unread_count: countRow[0].count });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Failed to mark notification.' });
  }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await db.execute('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error(err); res.status(500).json({ success: false, message: 'Failed to mark notifications.' });
  }
};
