// backend/adminAuth.js
const jwt = require('jsonwebtoken');


const JWT_SECRET = 'your_jwt_secret_key'; // Change this to a strong secret

// Check admin credentials from DB
async function checkAdminCredentials(username, password, poolPromise, sql) {
  const pool = await poolPromise;
  // Trim and make username case-insensitive
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();
  const result = await pool.request()
    .input('username', sql.NVarChar, trimmedUsername)
    .input('password', sql.NVarChar, trimmedPassword)
    .query('SELECT * FROM QuizApp.Admins WHERE LOWER(Username) = LOWER(@username) AND Password = @password');
  return result.recordset.length > 0;
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Malformed token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error('Invalid role');
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = {
  JWT_SECRET,
  authenticateAdmin,
  checkAdminCredentials,
};
