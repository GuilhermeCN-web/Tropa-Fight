export type DiscountSource = 'PROMOTION' | 'COUPON'
export type DiscountKind = 'PERCENTAGE' | 'FIXED_AMOUNT'

export type DiscountCandidate = {
  id: string
  source: DiscountSource
  kind: DiscountKind
  value: number
  priority: number
  label: string
}

export type DiscountCalculation = {
  source: DiscountSource
  id: string
  label: string
  amountCents: number
}

export function calculateDiscountAmount(
  subtotalCents: number,
  kind: DiscountKind,
  value: number,
): number {
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < 0) {
    throw new Error('Subtotal must be a non-negative safe integer.')
  }

  if (kind === 'PERCENTAGE') {
    if (!Number.isSafeInteger(value) || value < 1 || value > 100) {
      throw new Error('Percentage must be an integer between 1 and 100.')
    }
    const cents = BigInt(subtotalCents)
    const rounded = (cents * BigInt(value) + 50n) / 100n
    return Number(rounded)
  }

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error('Fixed discount must be a positive safe integer.')
  }
  return Math.min(subtotalCents, value)
}

export function selectBestDiscount(
  subtotalCents: number,
  candidates: DiscountCandidate[],
): DiscountCalculation | null {
  const applicable = candidates
    .map((candidate) => ({
      ...candidate,
      amountCents: calculateDiscountAmount(
        subtotalCents,
        candidate.kind,
        candidate.value,
      ),
    }))
    .filter((candidate) => candidate.amountCents > 0)
    .sort((left, right) => {
      if (left.amountCents !== right.amountCents) {
        return right.amountCents - left.amountCents
      }
      if (left.source !== right.source) {
        return left.source === 'PROMOTION' ? -1 : 1
      }
      if (left.priority !== right.priority) {
        return right.priority - left.priority
      }
      return left.id < right.id ? -1 : left.id > right.id ? 1 : 0
    })

  const winner = applicable[0]
  return winner
    ? {
        source: winner.source,
        id: winner.id,
        label: winner.label,
        amountCents: winner.amountCents,
      }
    : null
}
