import { createHash, randomBytes } from 'node:crypto'

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(password + salt).digest('hex')
  return `${salt}:${hash}`
}

export function comparePasswords(plaintextPassword: string, hashedPassword: string): boolean {
  const [salt, originalHash] = hashedPassword.split(':')
  const hash = createHash('sha256').update(plaintextPassword + salt).digest('hex')
  return hash === originalHash
}
