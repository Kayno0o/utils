import { createHash, getRandomValues } from 'node:crypto'

export function hashPassword(password: string) {
  const salt = Array.from(getRandomValues(new Uint8Array(16)))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  const hash = createHash('sha256').update(password + salt).digest('hex')
  return `${salt}:${hash}`
}

export function comparePasswords(plaintextPassword: string, hashedPassword: string): boolean {
  const [salt, originalHash] = hashedPassword.split(':')
  const hash = createHash('sha256').update(plaintextPassword + salt).digest('hex')
  return hash === originalHash
}
