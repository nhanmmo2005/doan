const jwt = require("jsonwebtoken");

module.exports = function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      req.user = null;
      return next();
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { uid, role, name }
    next();
  } catch (e) {
    // Invalid token, continue without user
    req.user = null;
    next();
  }
};
