# syntax=docker/dockerfile:1

# Imagem para execução LOCAL do Tropa Fight (Next.js + PostgreSQL via Docker Compose).
# Não é um artefato de publicação: produção e ambientes hospedados seguem PENDING_APPROVAL.

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Em checkout limpo `.next/types` ainda não existe; o typecheck do build depende dele.
# O next-env.d.ts do repositório é regravado pelo Next conforme o modo (dev/build).
# O Next avalia os módulos das rotas ao coletar dados e o pool exige DATABASE_URL.
# Valor fictício, sem credencial e restrito a este estágio: nenhuma conexão é aberta no build.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build \
    sh -c 'npx next typegen && npm run build'

FROM node:${NODE_VERSION}-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next
COPY --chown=node:node package.json next.config.ts ./
COPY --chown=node:node public ./public
# Necessários para `npm run db:migrate` e `npm run identity:create-admin` dentro do contêiner.
COPY --chown=node:node db ./db
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node src ./src

USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
