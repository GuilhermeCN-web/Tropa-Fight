import type {
  OrderDetail,
  OrderPage,
  OrderPageResult,
} from '../domain/order-query'

export interface OrderQueryRepository {
  listForCustomer(customerId: string, page: OrderPage): Promise<OrderPageResult>
  listForAdmin(page: OrderPage): Promise<OrderPageResult>
  findForCustomer(
    customerId: string,
    orderId: string,
  ): Promise<OrderDetail | null>
  findForAdmin(orderId: string): Promise<OrderDetail | null>
}

export class OrderQueryService {
  private readonly repository: OrderQueryRepository

  constructor(repository: OrderQueryRepository) {
    this.repository = repository
  }

  listForCustomer(customerId: string, page: OrderPage) {
    return this.repository.listForCustomer(customerId, page)
  }

  listForAdmin(page: OrderPage) {
    return this.repository.listForAdmin(page)
  }

  findForCustomer(customerId: string, orderId: string) {
    return this.repository.findForCustomer(customerId, orderId)
  }

  findForAdmin(orderId: string) {
    return this.repository.findForAdmin(orderId)
  }
}
