import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export async function hashPassword(password) {
  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
  return await bcrypt.hash(password, rounds)
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'banking-system',
    audience: 'banking-users'
  })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'banking-system',
      audience: 'banking-users'
    })
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '30d',
    issuer: 'banking-system',
    audience: 'banking-refresh'
  })
}
