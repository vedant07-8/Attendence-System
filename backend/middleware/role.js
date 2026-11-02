/**
 * Middleware to restrict access based on user role
 * @param  {...string} roles - Allowed roles e.g. 'admin', 'faculty', 'student'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized to access this resource`
      });
    }
    next();
  };
};

module.exports = { authorize };
