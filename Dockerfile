# ============================================
# 阶段 1: 构建阶段 - 使用国内 Node.js 镜像源
# ============================================
FROM docker.1ms.run/node:24-alpine AS builder

# 设置工作目录
WORKDIR /app

# 使用阿里云 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm
RUN npm install -g pnpm

# 先复制依赖文件和必要配置，利用 Docker 缓存层
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* quasar.config.ts index.html ./

# 安装依赖（使用国内 pnpm 源）
RUN pnpm config set registry https://registry.npmmirror.com \
    && pnpm install --frozen-lockfile || pnpm install

# 复制源码并构建
COPY . .
RUN pnpm build

# ============================================
# 阶段 2: 运行阶段 - 使用国内 Nginx 镜像
# ============================================
FROM docker.1ms.run/nginx:alpine

# 移除默认的 Nginx 配置和欢迎页（减小镜像体积）
RUN rm /etc/nginx/conf.d/default.conf \
    && rm -rf /usr/share/nginx/html/*

# 复制构建产物和 Nginx 配置
COPY --from=builder /app/dist/spa /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 5200

CMD ["nginx", "-g", "daemon off;"]
