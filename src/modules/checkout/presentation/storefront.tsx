/**
 * Utilitários de apresentação compartilhados pelas telas do cliente
 * (produto, carrinho, checkout, pagamento e pedidos — TASK-023).
 *
 * As telas apenas exibem os valores retornados pela API: nenhum total é
 * calculado no navegador (ADR-007).
 */

export type ApiFailure = {
  status: number
  code?: string
  message?: string
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | ({ ok: false } & ApiFailure & { body: unknown })

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function formatCents(cents: number): string {
  return currency.format(cents / 100)
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(date)
}

export function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : isoDate
}

export function formatAttributes(attributes: Record<string, unknown>): string {
  const parts: string[] = []
  if (typeof attributes.size === 'string')
    parts.push(`Tamanho ${attributes.size}`)
  if (typeof attributes.color === 'string')
    parts.push(`Cor ${attributes.color}`)
  return parts.join(' · ')
}

export const orderStatusLabel: Record<string, string> = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAYMENT_CONFIRMED: 'Pagamento confirmado',
  EXPIRED: 'Expirado',
}

export const paymentStatusLabel: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Em processamento',
  APPROVED: 'Aprovado',
  FAILED: 'Recusado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
}

export const paymentMethodLabel: Record<string, string> = {
  PIX: 'PIX',
  DEBIT_CARD: 'Cartão de débito',
  CREDIT_CARD: 'Cartão de crédito',
}

export const shipmentStatusLabel: Record<string, string> = {
  NOT_SHIPPED: 'Não enviado',
}

export function label(map: Record<string, string>, value: string): string {
  return map[value] ?? value
}

const codeMessages: Record<string, string> = {
  INSUFFICIENT_STOCK: 'Estoque insuficiente para a quantidade solicitada.',
  STOCK_UNAVAILABLE:
    'Estoque insuficiente para concluir a compra. Revise as quantidades no carrinho.',
  UNAVAILABLE: 'Este item não está disponível para venda.',
  CART_EMPTY: 'Seu carrinho está vazio.',
  QUOTE_CHANGED:
    'Os valores mudaram desde a cotação. Confira a nova cotação e confirme novamente.',
  COUPON_INVALID:
    'O cupom aplicado deixou de ser válido. Revise o carrinho antes de continuar.',
  COUPON_NOT_FOUND: 'Cupom não encontrado.',
  COUPON_INACTIVE: 'Este cupom não está ativo.',
  COUPON_NOT_STARTED: 'Este cupom ainda não está válido.',
  COUPON_EXPIRED: 'Este cupom expirou.',
  COUPON_USAGE_LIMIT_REACHED: 'Este cupom atingiu o limite de uso.',
  COUPON_CUSTOMER_LIMIT_REACHED: 'Você já atingiu o limite de uso deste cupom.',
  COUPON_NOT_ELIGIBLE: 'Este cupom não se aplica ao seu carrinho.',
  COUPON_NOT_APPLICABLE: 'Este cupom não se aplica ao seu carrinho.',
  COUPON_MINIMUM_AMOUNT_NOT_MET:
    'O carrinho não atingiu o valor mínimo exigido pelo cupom.',
  EXPIRED: 'O prazo de pagamento deste pedido expirou.',
}

const serverMessages: Record<string, string> = {
  'Insufficient inventory for requested quantity.':
    'Estoque insuficiente para a quantidade solicitada.',
  'Variant is not commercially available.':
    'Esta variante não está disponível para venda.',
  'Variant not found.': 'Variante não encontrada.',
  'Cart item not found.': 'Item não encontrado no carrinho.',
  'Quantity must be a positive safe integer.':
    'Informe uma quantidade inteira maior que zero.',
  'CPF is invalid.': 'CPF inválido.',
  'Brazilian phone is invalid.':
    'Telefone inválido. Use DDD e número (10 ou 11 dígitos).',
  'Brazilian postal code is invalid.': 'CEP inválido. Use 8 dígitos.',
  'Only Brazilian addresses are supported.':
    'Somente endereços no Brasil são aceitos (UF com 2 letras).',
  'Order is not awaiting payment.':
    'Este pedido não está aguardando pagamento.',
  'A payment already exists for this order.':
    'Já existe um pagamento para este pedido. Consulte o pedido para ver a situação.',
  'This cart has already been converted into an order.':
    'Este carrinho já foi convertido em pedido. Consulte seus pedidos.',
}

export function describeApiError(failure: ApiFailure): string {
  if (failure.code && codeMessages[failure.code])
    return codeMessages[failure.code]!
  if (failure.message && serverMessages[failure.message])
    return serverMessages[failure.message]!
  if (failure.message?.startsWith('Invalid address field'))
    return 'Preencha corretamente todos os campos obrigatórios do endereço.'
  switch (failure.status) {
    case 0:
      return 'Não foi possível conectar à aplicação. Verifique sua conexão e tente novamente.'
    case 400:
      return 'Dados inválidos. Revise as informações e tente novamente.'
    case 401:
      return 'Sua sessão expirou. Faça login para continuar.'
    case 403:
      return 'Esta área é exclusiva para contas de cliente.'
    case 404:
      return 'O recurso solicitado não foi encontrado.'
    case 409:
      return 'A operação não pôde ser concluída no estado atual. Atualize a página e tente novamente.'
    default:
      return 'Não foi possível concluir a operação agora. Tente novamente.'
  }
}

export function redirectToLogin(): void {
  window.location.assign('/login')
}

/**
 * Executa uma chamada às APIs existentes. Respostas 401 levam ao login.
 * Erros de rede retornam `status: 0` para que a tela possa reenviar a mesma
 * requisição (reutilizando a mesma `Idempotency-Key`, quando houver).
 */
export async function requestJson<T>(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<ApiResult<T>> {
  const { json, headers, ...rest } = init
  let response: Response
  try {
    response = await fetch(url, {
      ...rest,
      headers: {
        ...(json === undefined ? {} : { 'content-type': 'application/json' }),
        ...headers,
      },
      ...(json === undefined ? {} : { body: JSON.stringify(json) }),
      cache: 'no-store',
    })
  } catch {
    return { ok: false, status: 0, body: null }
  }
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }
  if (response.ok) return { ok: true, status: response.status, data: body as T }
  if (response.status === 401) redirectToLogin()
  const record =
    body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  return {
    ok: false,
    status: response.status,
    code: typeof record.code === 'string' ? record.code : undefined,
    message:
      typeof record.error === 'string'
        ? record.error
        : typeof record.message === 'string'
          ? record.message
          : undefined,
    body,
  }
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID()
}

export function readSession(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeSession(key: string, value: string): void {
  try {
    window.sessionStorage.setItem(key, value)
  } catch {
    // Armazenamento indisponível: a tela continua funcionando sem ele.
  }
}

export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p className="store-alert" role="alert">
      {message}
    </p>
  ) : null
}
