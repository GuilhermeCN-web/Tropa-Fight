import type {
  AdminOrderFilters,
  OrderDetail,
  OrderPage,
  OrderPageResult,
} from '../domain/order-query'

export interface OrderQueryRepository {
  listForCustomer(customerId: string, page: OrderPage): Promise<OrderPageResult>
  listForAdmin(
    page: OrderPage,
    filters: AdminOrderFilters,
  ): Promise<OrderPageResult>
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

  listForAdmin(page: OrderPage, filters: AdminOrderFilters = {}) {
    return this.repository.listForAdmin(page, filters)
  }

  findForCustomer(customerId: string, orderId: string) {
    return this.repository.findForCustomer(customerId, orderId)
  }

  findForAdmin(orderId: string) {
    return this.repository.findForAdmin(orderId)
  }
}
