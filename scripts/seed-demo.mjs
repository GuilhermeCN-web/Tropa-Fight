// Seed de DEMONSTRAÇÃO do Tropa Fight (ambiente LOCAL).
//
// Popula catálogo, estoque, um cupom e um cliente de demonstração usando somente
// a API HTTP da aplicação em execução; portanto validações, permissões e auditoria
// seguem as regras normais. Idempotente: pode ser executado várias vezes.
//
// Pré-requisitos:
//   1. aplicação no ar (ex.: `docker compose up --build`);
//   2. administrador criado com `npm run identity:create-admin`
//      (este script NÃO cria administradores: o bootstrap é interativo e de uso único).
//
// Uso:
//   SEED_ADMIN_EMAIL=admin@exemplo.com SEED_ADMIN_PASSWORD='...' npm run seed:demo
//
// Variáveis: SEED_BASE_URL (padrão http://localhost:3000), SEED_ADMIN_EMAIL,
// SEED_ADMIN_PASSWORD, SEED_CUSTOMER_EMAIL, SEED_CUSTOMER_PASSWORD.

const baseUrl = (process.env.SEED_BASE_URL ?? 'http://localhost:3000').replace(
  /\/+$/,
  '',
)
const adminEmail = process.env.SEED_ADMIN_EMAIL
const adminPassword = process.env.SEED_ADMIN_PASSWORD
// Credencial pública de demonstração, válida somente para o ambiente local.
const customerEmail =
  process.env.SEED_CUSTOMER_EMAIL ?? 'cliente.demo@tropafight.local'
const customerPassword = process.env.SEED_CUSTOMER_PASSWORD ?? 'Tropa#Demo2026'

const hostname = new URL(baseUrl).hostname
if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname)) {
  console.error(
    `Recusado: o seed de demonstração só roda contra localhost (recebido: ${hostname}).`,
  )
  process.exit(1)
}
if (!adminEmail || !adminPassword) {
  console.error(
    'Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD (administrador criado por `npm run identity:create-admin`).',
  )
  process.exit(1)
}

let cookie = ''

async function api(method, path, body, { expect = [200, 201] } = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await response.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // resposta não JSON
  }
  if (!expect.includes(response.status)) {
    throw new Error(
      `${method} /api${path} -> HTTP ${response.status}: ${data?.error ?? text.slice(0, 200)}`,
    )
  }
  return { status: response.status, data, response }
}

async function login(email, password) {
  const { response } = await api('POST', '/auth/login', { email, password })
  const sessionCookie = response.headers
    .getSetCookie()
    .map((value) => value.split(';')[0])
  if (sessionCookie.length === 0) throw new Error('Login sem cookie de sessão.')
  cookie = sessionCookie.join('; ')
}

const log = (action, label) => console.log(`${action.padEnd(8)} ${label}`)

async function ensureNamed(kind, plural, name) {
  const list = (await api('GET', `/admin/${kind}`)).data[plural]
  const found = list.find((item) => item.name === name)
  if (found) {
    log('existe', `${kind}: ${name}`)
    return found
  }
  const created = (await api('POST', `/admin/${kind}`, { name })).data
  log('criado', `${kind}: ${name}`)
  return created[kind === 'brands' ? 'brand' : 'category']
}

const brands = ['Tropa Fight', 'Venum', 'Everlast']
const categories = ['Luvas', 'Protetores', 'Vestuário']

const products = [
  {
    name: 'Luva de Boxe Tropa Pro',
    description:
      'Luva de treino com espuma multicamada e fechamento em velcro.',
    brand: 'Tropa Fight',
    categories: ['Luvas'],
    variants: [
      {
        sku: 'DEMO-LUVA-PRO-12',
        attributes: { size: '12oz', color: 'preta' },
        priceCents: 29900,
        stock: 40,
      },
      {
        sku: 'DEMO-LUVA-PRO-14',
        attributes: { size: '14oz', color: 'preta' },
        priceCents: 31900,
        stock: 25,
      },
      {
        sku: 'DEMO-LUVA-PRO-16',
        attributes: { size: '16oz', color: 'vermelha' },
        priceCents: 33900,
        stock: 0,
      },
    ],
  },
  {
    name: 'Luva de MMA Challenger',
    description: 'Luva aberta para treino de MMA e saco de pancada.',
    brand: 'Venum',
    categories: ['Luvas'],
    variants: [
      {
        sku: 'DEMO-MMA-CH-M',
        attributes: { size: 'M', color: 'preta' },
        priceCents: 24900,
        stock: 30,
      },
      {
        sku: 'DEMO-MMA-CH-G',
        attributes: { size: 'G', color: 'preta' },
        priceCents: 24900,
        stock: 30,
      },
    ],
  },
  {
    name: 'Protetor Bucal Duplo',
    description: 'Protetor bucal moldável para treinos e lutas.',
    brand: 'Everlast',
    categories: ['Protetores'],
    variants: [
      { sku: 'DEMO-BUCAL-DUPLO', attributes: {}, priceCents: 5900, stock: 100 },
    ],
  },
  {
    name: 'Caneleira Muay Thai',
    description: 'Caneleira em couro sintético com proteção de pé.',
    brand: 'Tropa Fight',
    categories: ['Protetores'],
    variants: [
      {
        sku: 'DEMO-CANELEIRA-P',
        attributes: { size: 'P' },
        priceCents: 17900,
        stock: 15,
      },
      {
        sku: 'DEMO-CANELEIRA-M',
        attributes: { size: 'M' },
        priceCents: 17900,
        stock: 15,
      },
    ],
  },
  {
    name: 'Camiseta Tropa Fight',
    description: 'Camiseta de algodão com estampa da equipe.',
    brand: 'Tropa Fight',
    categories: ['Vestuário'],
    variants: [
      {
        sku: 'DEMO-CAMISETA-M',
        attributes: { size: 'M', color: 'preta' },
        priceCents: 7900,
        stock: 60,
      },
      {
        sku: 'DEMO-CAMISETA-G',
        attributes: { size: 'G', color: 'preta' },
        priceCents: 7900,
        stock: 60,
      },
    ],
  },
]

async function seedProduct(spec, brandByName, categoryByName) {
  const existing = (await api('GET', '/admin/products')).data.products.find(
    (item) => item.name === spec.name,
  )
  let product = existing
  if (product) {
    log('existe', `produto: ${spec.name}`)
  } else {
    product = (
      await api('POST', '/admin/products', {
        name: spec.name,
        description: spec.description,
        brandId: brandByName.get(spec.brand).id,
        categoryIds: spec.categories.map((name) => categoryByName.get(name).id),
      })
    ).data.product
    log('criado', `produto: ${spec.name}`)
  }

  const currentVariants = (
    await api('GET', `/admin/products/${product.id}/variants`)
  ).data.variants
  for (const variantSpec of spec.variants) {
    let variant = currentVariants.find(
      (item) => item.sku.trim().toLowerCase() === variantSpec.sku.toLowerCase(),
    )
    if (variant) {
      log('existe', `  variante: ${variantSpec.sku}`)
    } else {
      variant = (
        await api('POST', `/admin/products/${product.id}/variants`, {
          sku: variantSpec.sku,
          attributes: variantSpec.attributes,
          priceCents: variantSpec.priceCents,
          status: 'ACTIVE',
        })
      ).data.variant
      log('criada', `  variante: ${variantSpec.sku}`)
    }

    // Entrada somente da diferença, para repetir o seed sem acumular estoque.
    const quantity = (await api('GET', `/admin/inventory/${variant.id}`)).data
      .inventory.quantity
    const missing = variantSpec.stock - quantity
    if (missing > 0) {
      await api('POST', `/admin/inventory/${variant.id}/entries`, {
        quantity: missing,
        reason: 'Estoque inicial de demonstração',
      })
      log(
        'estoque',
        `  ${variantSpec.sku}: +${missing} (saldo ${variantSpec.stock})`,
      )
    }
  }

  if (product.publicationState === 'DRAFT') {
    await api('POST', `/admin/products/${product.id}/publish`)
    log('publica', `produto: ${spec.name}`)
  }
}

async function seedCoupon() {
  const code = 'TROPA10'
  const coupons = (await api('GET', '/admin/coupons')).data.coupons
  if (coupons.some((coupon) => coupon.code === code)) {
    log('existe', `cupom: ${code}`)
    return
  }
  const startsAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const promotion = (
    await api('POST', '/admin/promotions', {
      name: 'Cupom de demonstração 10%',
      applicationType: 'COUPON',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      startsAt,
      status: 'ACTIVE',
    })
  ).data.promotion
  await api('POST', '/admin/coupons', {
    promotionId: promotion.id,
    code,
    status: 'ACTIVE',
  })
  log('criado', `cupom: ${code} (10% sobre o carrinho)`)
}

async function seedCustomer() {
  const { status } = await api(
    'POST',
    '/auth/register',
    { email: customerEmail, password: customerPassword },
    { expect: [200, 201, 409] },
  )
  log(status === 409 ? 'existe' : 'criado', `cliente: ${customerEmail}`)
}

await login(adminEmail, adminPassword)
log('login', `administrador ${adminEmail}`)

const brandByName = new Map()
for (const name of brands)
  brandByName.set(name, await ensureNamed('brands', 'brands', name))
const categoryByName = new Map()
for (const name of categories)
  categoryByName.set(name, await ensureNamed('categories', 'categories', name))

for (const spec of products)
  await seedProduct(spec, brandByName, categoryByName)
await seedCoupon()
await seedCustomer()

console.log(`\nSeed concluído. Catálogo: ${baseUrl}/catalog`)
console.log(
  `Cliente de demonstração: ${customerEmail} (senha em SEED_CUSTOMER_PASSWORD ou padrão do script)`,
)
console.log('Cupom: TROPA10')
