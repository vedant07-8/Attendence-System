const jwt = require('jsonwebtoken');

/**
 * Sign JWT token with userId and role
 * @param {string} id - User ObjectId
 * @param {string} role - User role (admin | faculty | student)
 * @returns {string} - JWT signed token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'attendance_fallback_jwt_secret_key_387492',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    }
  );
};

module.exports = generateToken;
