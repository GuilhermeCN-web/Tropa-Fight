export const passwordPolicy = {
  minimumLength: 8,
  maximumLength: 128,
} as const

export function validatePassword(password: string): string[] {
  const errors: string[] = []
  const length = [...password].length

  if (length < passwordPolicy.minimumLength) {
    errors.push('A senha deve ter pelo menos 8 caracteres.')
  }
  if (length > passwordPolicy.maximumLength) {
    errors.push('A senha deve ter no máximo 128 caracteres.')
  }
  if (!/\p{Lu}/u.test(password)) {
    errors.push('A senha deve conter uma letra maiúscula.')
  }
  if (!/\p{Ll}/u.test(password)) {
    errors.push('A senha deve conter uma letra minúscula.')
  }
  if (!/\p{N}/u.test(password)) {
    errors.push('A senha deve conter um número.')
  }
  if (!/[^\p{L}\p{N}\s]/u.test(password)) {
    errors.push('A senha deve conter um caractere especial.')
  }

  return errors
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
