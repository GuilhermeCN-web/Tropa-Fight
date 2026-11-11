import type {
  CustomerDetail,
  CustomerPageResult,
  CustomerQuery,
} from '../domain/customer-query'

export interface CustomerQueryRepository {
  list(query: CustomerQuery): Promise<CustomerPageResult>
  find(customerId: string): Promise<CustomerDetail | null>
}

/** Read-only administrative customer queries (RF-034, UC-017). */
export class CustomerQueryService {
  private readonly repository: CustomerQueryRepository

  constructor(repository: CustomerQueryRepository) {
    this.repository = repository
  }

  list(query: CustomerQuery) {
    return this.repository.list(query)
  }

  find(customerId: string) {
    return this.repository.find(customerId)
  }
}
