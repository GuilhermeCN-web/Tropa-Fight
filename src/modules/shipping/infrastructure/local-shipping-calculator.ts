import 'server-only'
import { calculateShipping } from '../../checkout/domain/checkout'
import type {
  ShippingCalculator,
  ShippingQuote,
} from '../application/shipping-calculator'

export class LocalShippingCalculator implements ShippingCalculator {
  calculate(postalCode: string, asOf: Date): ShippingQuote {
    return calculateShipping(postalCode, asOf)
  }
}
