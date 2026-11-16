/**
 * Authentication and authorization middleware.
 */

const jwt = require('jsonwebtoken');
const env = require('./env');
const { unauthorized, forbidden } = require('./errors');

const JWT_ALGORITHM = 'HS256';

function signToken(user) {
  return jwt.sign({ id: String(user._id), tv: user.tokenVersion || 0 }, env.jwtSecret, {
    expiresIn: env.jwtExpire,
    algorithm: JWT_ALGORITHM,
  });
}

function readBearer(req) {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

/** Resolve the token to an active user, or null. Never throws for bad tokens. */
async function resolveUser(req) {
  const token = readBearer(req);
  if (!token) return null;

  let payload;
  try {
    // Pinning the algorithm blocks "alg: none" and key-confusion tokens.
    payload = jwt.verify(token, env.jwtSecret, { algorithms: [JWT_ALGORITHM] });
  } catch {
    return null;
  }
  if (!payload || typeof payload.id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(payload.id)) return null;

  const User = require('../entities/User');
  const user = await User.findById(payload.id);
  if (!user) return null;
  if (user.status === 'banned') return null;
  // Tokens issued before a password change / "log out everywhere" stop working.
  if ((payload.tv || 0) !== (user.tokenVersion || 0)) return null;
  return user;
}

/** Require a valid login. */
async function protect(req, res, next) {
  try {
    const user = await resolveUser(req);
    if (!user) return next(unauthorized('Phiên đăng nhập không hợp lệ hoặc đã hết hạn'));
    req.user = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Attach the user when a valid token is present; continue as a guest otherwise. */
async function optionalAuth(req, res, next) {
  try {
    req.user = await resolveUser(req);
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Require one of the given roles. Must run after `protect`. */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(forbidden());
    return next();
  };
}

module.exports = { signToken, protect, optionalAuth, authorize, JWT_ALGORITHM };
