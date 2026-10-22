import { ApplicationError } from '../../application/errors/application-error'

export class InfrastructureError extends ApplicationError {
  constructor(message: string) {
    super(message)
    this.name = 'InfrastructureError'
  }
}
