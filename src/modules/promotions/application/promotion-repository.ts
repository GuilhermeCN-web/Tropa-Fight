import type {
  Promotion,
  PromotionApplicationType,
  PromotionStatus,
} from '../domain/promotion'
import type { DiscountKind } from '../../pricing/domain/discount'

export type CreatePromotionInput = {
  name: string
  applicationType: PromotionApplicationType
  discountType: DiscountKind
  discountValue: number
  minimumCartSubtotalCents: number | null
  startsAt: string
  expiresAt: string | null
  status: PromotionStatus
  priority: number
}

export type UpdatePromotionInput = Partial<
  Omit<CreatePromotionInput, 'applicationType'>
>

export interface PromotionRepository {
  list(): Promise<Promotion[]>
  create(input: CreatePromotionInput, actorId: string): Promise<Promotion>
  update(
    id: string,
    input: UpdatePromotionInput,
    actorId: string,
  ): Promise<Promotion>
}
