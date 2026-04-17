# ============================================
# Global args
# ============================================
ARG NODE_IMAGE=node:24-alpine
ARG NPM_REGISTRY=https://registry.npmjs.org
ARG CADDY_IMAGE=caddy:alpine

# ============================================
# Stage 1: Build
# ============================================
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

# 安装 pnpm 并配置 registry（利用缓存）
RUN npm config set registry ${NPM_REGISTRY}

# 复制依赖文件（利用 Docker 缓存层）
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* quasar.config.ts index.html ./

# 安装依赖
RUN npm ci

# 复制源码并构建
COPY . .
RUN npm run build

# ============================================
# Stage 2: Runtime
# ============================================
FROM ${CADDY_IMAGE}

COPY --from=builder /app/dist/spa /usr/share/caddy/html
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 5200

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
