import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

import { getJwtSecret } from './auth-secret.mjs'

export function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export function comparePassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(userId) {
  return jwt.sign({ userId }, getJwtSecret(), { algorithm: 'HS256', expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] })
  } catch (error) {
    return null
  }
}

export function getUserIdFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.substring(7)
  const decoded = verifyToken(token)
  return decoded?.userId || null
}

