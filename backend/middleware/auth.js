const { auth } = require('../config/firebaseAdmin');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    if (!auth) {
      throw new Error("Firebase Admin SDK is not initialized.");
    }
    const decodedToken = await auth.verifyIdToken(token);
    // Attach the decoded token to the request object.
    // The user's UID is in decodedToken.uid
    // The user's custom role (if set via custom claims) is in decodedToken.role
    req.user = decodedToken;
    next();
  } catch (err) {
    console.error("Token verification failed:", err.message);
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  // Assume that the user's role is set via Firebase Custom Claims and is available on req.user.role
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. This route requires role: ${roles.join(' or ')}`
    });
  }
  next();
};

module.exports = { authenticate, authorize };
