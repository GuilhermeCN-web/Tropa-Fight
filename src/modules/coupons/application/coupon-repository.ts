import type { Coupon } from '../domain/coupon'

export type CouponWithUsage = Coupon & {
  redeemedCount: number
}

export type CreateCouponInput = {
  promotionId: string
  code: string
  status: Coupon['status']
  usageLimit: number | null
  usageLimitPerCustomer: number | null
}

export type UpdateCouponInput = Partial<CreateCouponInput>

export interface CouponRepository {
  list(): Promise<CouponWithUsage[]>
  create(input: CreateCouponInput, actorId: string): Promise<Coupon>
  update(id: string, input: UpdateCouponInput, actorId: string): Promise<Coupon>
}
