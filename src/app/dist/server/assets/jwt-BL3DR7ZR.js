import bcrypt from "bcryptjs";
import * as jose from "jose";
import { v4 } from "uuid";
const SALT_ROUNDS = 12;
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
const secretString = process.env.JWT_SECRET || "p3bl-development-secret-change-in-production-minimum-32-chars";
const JWT_SECRET = new TextEncoder().encode(secretString);
const JWT_ISSUER = "p3bl";
const JWT_AUDIENCE = "p3bl-app";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
async function generateAccessToken(payload) {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1e3);
  const token = await new jose.SignJWT({
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    type: "access"
  }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setIssuer(JWT_ISSUER).setAudience(JWT_AUDIENCE).setExpirationTime(ACCESS_TOKEN_EXPIRY).sign(JWT_SECRET);
  return { token, expiresAt };
}
async function generateRefreshToken(payload) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
  const token = await new jose.SignJWT({
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    type: "refresh",
    sessionId: payload.sessionId
  }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setIssuer(JWT_ISSUER).setAudience(JWT_AUDIENCE).setExpirationTime(REFRESH_TOKEN_EXPIRY).sign(JWT_SECRET);
  return { token, expiresAt };
}
async function generateTokenPair(payload) {
  const sessionId = v4();
  const [accessResult, refreshResult] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken({ ...payload, sessionId })
  ]);
  return {
    accessToken: accessResult.token,
    refreshToken: refreshResult.token,
    accessTokenExpiresAt: accessResult.expiresAt,
    refreshTokenExpiresAt: refreshResult.expiresAt,
    sessionId
  };
}
async function verifyToken(token) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE
    });
    return payload;
  } catch {
    return null;
  }
}
async function verifyRefreshToken(token) {
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "refresh") {
    return null;
  }
  return payload;
}
function generatePasswordResetToken() {
  const token = v4() + v4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
  return { token, expiresAt };
}
export {
  verifyRefreshToken as a,
  generateAccessToken as b,
  generatePasswordResetToken as c,
  generateTokenPair as g,
  hashPassword as h,
  verifyPassword as v
};
