import * as jose from 'jose'
import { v4 as uuidv4 } from 'uuid'

// JWT configuration
const secretString = process.env.JWT_SECRET || 'p3bl-development-secret-change-in-production-minimum-32-chars'
const JWT_SECRET = new TextEncoder().encode(secretString)
const JWT_ISSUER = 'p3bl'
const JWT_AUDIENCE = 'p3bl-app'

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m' // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d' // 7 days

export interface TokenPayload extends jose.JWTPayload {
  sub: string // User ID
  email: string
  role: 'explorer' | 'creator' | 'admin' | 'pioneer'
  type: 'access' | 'refresh'
  sessionId?: string // For refresh tokens
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  accessTokenExpiresAt: Date
  refreshTokenExpiresAt: Date
}

/**
 * Generate an access token
 */
export async function generateAccessToken(payload: {
  userId: string
  email: string
  role: 'explorer' | 'creator' | 'admin' | 'pioneer'
}): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  
  const token = await new jose.SignJWT({
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    type: 'access' as const,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
  
  return { token, expiresAt }
}

/**
 * Generate a refresh token
 */
export async function generateRefreshToken(payload: {
  userId: string
  email: string
  role: 'explorer' | 'creator' | 'admin' | 'pioneer'
  sessionId: string
}): Promise<{ token: string; expiresAt: Date }> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  const token = await new jose.SignJWT({
    sub: payload.userId,
    email: payload.email,
    role: payload.role,
    type: 'refresh' as const,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET)
  
  return { token, expiresAt }
}

/**
 * Generate a token pair (access + refresh tokens)
 */
export async function generateTokenPair(payload: {
  userId: string
  email: string
  role: 'explorer' | 'creator' | 'admin' | 'pioneer'
}): Promise<TokenPair & { sessionId: string }> {
  const sessionId = uuidv4()
  
  const [accessResult, refreshResult] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken({ ...payload, sessionId }),
  ])
  
  return {
    accessToken: accessResult.token,
    refreshToken: refreshResult.token,
    accessTokenExpiresAt: accessResult.expiresAt,
    refreshTokenExpiresAt: refreshResult.expiresAt,
    sessionId,
  }
}

/**
 * Verify and decode a token
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    })
    
    return payload as TokenPayload
  } catch {
    return null
  }
}

/**
 * Verify specifically an access token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  const payload = await verifyToken(token)
  
  if (!payload || payload.type !== 'access') {
    return null
  }
  
  return payload
}

/**
 * Verify specifically a refresh token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  const payload = await verifyToken(token)
  
  if (!payload || payload.type !== 'refresh') {
    return null
  }
  
  return payload
}

/**
 * Generate a password reset token (simple random token, not JWT)
 */
export function generatePasswordResetToken(): { token: string; expiresAt: Date } {
  const token = uuidv4() + uuidv4() // 64 char random string
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  
  return { token, expiresAt }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  return authHeader.slice(7)
}
