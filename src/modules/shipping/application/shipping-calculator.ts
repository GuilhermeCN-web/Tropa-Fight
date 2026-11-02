export type ShippingQuote = {
  method: 'STANDARD'
  shippingCents: number
  estimatedBusinessDays: number
  estimatedDeliveryDate: string
}

export interface ShippingCalculator {
  calculate(postalCode: string, asOf: Date): ShippingQuote
}
