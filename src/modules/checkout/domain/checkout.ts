export type AddressInput = {
  recipientName: string
  cpf: string
  phone: string
  postalCode: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
  country: string
  complement?: string
  reference?: string
}

export type Address = AddressInput & {
  id: string
  customerId: string
  createdAt: string
  updatedAt: string
}

export type AddressSnapshot = Omit<AddressInput, 'cpf' | 'phone'> & {
  cpf: string
  phone: string
}

export class CheckoutError extends Error {
  readonly code:
    | 'VALIDATION'
    | 'NOT_FOUND'
    | 'CART_EMPTY'
    | 'STOCK_UNAVAILABLE'
    | 'QUOTE_CHANGED'
    | 'CONFLICT'
    | 'COUPON_INVALID'
  constructor(message: string, code: CheckoutError['code']) {
    super(message)
    this.code = code
    this.name = 'CheckoutError'
  }
}

function digits(value: string) {
  return value.replace(/\D/g, '')
}

export function validCpf(value: string): boolean {
  const cpf = digits(value)
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  const check = (length: number) => {
    const sum = cpf
      .slice(0, length)
      .split('')
      .reduce(
        (total, digit, index) => total + Number(digit) * (length + 1 - index),
        0,
      )
    const remainder = (sum * 10) % 11
    return (remainder === 10 ? 0 : remainder) === Number(cpf[length])
  }
  return check(9) && check(10)
}

export function normalizeAddress(input: unknown): AddressInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new CheckoutError('Address must be an object.', 'VALIDATION')
  }
  const value = input as Record<string, unknown>
  const required = [
    'recipientName',
    'cpf',
    'phone',
    'postalCode',
    'street',
    'number',
    'neighborhood',
    'city',
    'state',
    'country',
  ]
  if (
    Object.keys(value).some(
      (key) => ![...required, 'complement', 'reference'].includes(key),
    )
  ) {
    throw new CheckoutError(
      'Address contains unsupported fields.',
      'VALIDATION',
    )
  }
  const text = (key: string, max: number) => {
    const item = value[key]
    if (typeof item !== 'string' || !item.trim() || item.trim().length > max) {
      throw new CheckoutError(`Invalid address field: ${key}.`, 'VALIDATION')
    }
    return item.trim()
  }
  const cpf = digits(text('cpf', 20))
  const phone = digits(text('phone', 30))
  const postalCode = digits(text('postalCode', 20))
  const state = text('state', 2).toUpperCase()
  const country = text('country', 2).toUpperCase()
  if (!validCpf(cpf)) throw new CheckoutError('CPF is invalid.', 'VALIDATION')
  if (!/^\d{10,11}$/.test(phone))
    throw new CheckoutError('Brazilian phone is invalid.', 'VALIDATION')
  if (!/^\d{8}$/.test(postalCode))
    throw new CheckoutError('Brazilian postal code is invalid.', 'VALIDATION')
  if (!/^[A-Z]{2}$/.test(state) || country !== 'BR')
    throw new CheckoutError(
      'Only Brazilian addresses are supported.',
      'VALIDATION',
    )
  const optional = (key: string, max: number) => {
    const item = value[key]
    if (item === undefined || item === '') return undefined
    if (typeof item !== 'string' || item.trim().length > max) {
      throw new CheckoutError(`Invalid address field: ${key}.`, 'VALIDATION')
    }
    return item.trim()
  }
  return {
    recipientName: text('recipientName', 120),
    cpf,
    phone,
    postalCode,
    street: text('street', 160),
    number: text('number', 30),
    neighborhood: text('neighborhood', 100),
    city: text('city', 100),
    state,
    country,
    ...(optional('complement', 120)
      ? { complement: optional('complement', 120) }
      : {}),
    ...(optional('reference', 160)
      ? { reference: optional('reference', 160) }
      : {}),
  }
}

export function calculateShipping(postalCode: string, createdAt: Date) {
  if (!/^\d{8}$/.test(postalCode))
    throw new CheckoutError('Brazilian postal code is invalid.', 'VALIDATION')
  const estimatedDeliveryDate = new Date(createdAt)
  let businessDays = 0
  while (businessDays < 5) {
    estimatedDeliveryDate.setUTCDate(estimatedDeliveryDate.getUTCDate() + 1)
    const day = estimatedDeliveryDate.getUTCDay()
    if (day !== 0 && day !== 6) businessDays++
  }
  return {
    method: 'STANDARD' as const,
    shippingCents: 2000,
    estimatedBusinessDays: 5,
    estimatedDeliveryDate: estimatedDeliveryDate.toISOString().slice(0, 10),
  }
}

export function safeCents(value: number) {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new CheckoutError(
      'Checkout amount exceeds the supported range.',
      'VALIDATION',
    )
  return value
}

export function allocateDiscountAcrossItems(
  items: Array<{ variantId: string; subtotalCents: number }>,
  discountCents: number,
): Map<string, number> {
  safeCents(discountCents)
  const subtotalCents = items.reduce(
    (total, item) => total + safeCents(item.subtotalCents),
    0,
  )
  if (!Number.isSafeInteger(subtotalCents) || discountCents > subtotalCents) {
    throw new CheckoutError(
      'Discount allocation exceeds item subtotals.',
      'VALIDATION',
    )
  }
  if (new Set(items.map((item) => item.variantId)).size !== items.length) {
    throw new CheckoutError(
      'Discount allocation contains duplicate items.',
      'VALIDATION',
    )
  }
  if (subtotalCents === 0) {
    if (discountCents !== 0) {
      throw new CheckoutError(
        'Cannot allocate a discount over an empty subtotal.',
        'VALIDATION',
      )
    }
    return new Map(items.map((item) => [item.variantId, 0]))
  }

  const denominator = BigInt(subtotalCents)
  const totalDiscount = BigInt(discountCents)
  const allocations = items.map((item) => {
    const product = totalDiscount * BigInt(item.subtotalCents)
    return {
      variantId: item.variantId,
      cents: Number(product / denominator),
      remainder: product % denominator,
    }
  })
  let remaining =
    discountCents - allocations.reduce((total, item) => total + item.cents, 0)
  const priority = [...allocations].sort((left, right) => {
    if (left.remainder !== right.remainder)
      return left.remainder > right.remainder ? -1 : 1
    return left.variantId < right.variantId
      ? -1
      : left.variantId > right.variantId
        ? 1
        : 0
  })
  for (const item of priority) {
    if (remaining === 0) break
    item.cents += 1
    remaining -= 1
  }
  return new Map(allocations.map((item) => [item.variantId, item.cents]))
}
