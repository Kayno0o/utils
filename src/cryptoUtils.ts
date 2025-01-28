export async function hashPassword(password: string) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
  return `${salt}:${hash}`
}

export async function comparePasswords(plaintextPassword: string, hashedPassword: string): Promise<boolean> {
  const [salt, originalHash] = hashedPassword.split(':')
  const encoder = new TextEncoder()
  const data = encoder.encode(plaintextPassword + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hash = Array.from(new Uint8Array(hashBuffer))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
  return hash === originalHash
}
