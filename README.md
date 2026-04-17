# Cat Admin - 猫咪管理系统

一个基于 Quasar Framework 构建的现代化猫咪管理后台系统，提供猫咪信息管理、设施管理、操作记录追踪等功能。

## 功能特性

### 📊 数据看板 (首页)

- 实时统计：猫咪总数、设施数量、今日操作、待处理事件
- 数据可视化：品种分布、性别比例、操作类型统计
- 最近活动：快速查看最近操作记录和事件记录
- 智能提醒：自动识别需要关注的猫咪（体温异常、生病、受伤等）

### 🗂️ 数据管理

- 猫咪信息管理：增删改查猫咪基本信息、照片、品种、性别等
- 设施管理：管理猫咪设施信息、地址、管理员联系方式
- 操作记录：记录猫咪日常操作（测体温、绝育、体检、驱虫、修剪指甲、洗澡、疫苗等）
- 事件记录：记录猫咪特殊事件（生病、受伤、怀孕、分娩、死亡、合同解除等）
- 状态监控：实时监控猫咪体温、体重、剪指甲时间等状态信息
- 设施状态：记录设施消毒、喂食、喂水、逗猫、清理猫砂等状态

### ⚡ 操作台

- 快捷操作：一键记录日常操作，提高工作效率
- 设施操作：快速记录消毒、喂食、喂水、逗猫、清理猫砂
- 猫咪操作：快速记录测体温、绝育、体检、驱虫、修剪指甲、洗澡、疫苗
- 事件记录：快速记录生病、受伤、怀孕、分娩、死亡、合同解除等事件

### 🔐 认证系统

- 用户登录认证
- 路由权限控制
- Token 自动管理

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **UI 组件库**: Quasar Framework 2.16
- **状态管理**: Pinia
- **路由管理**: Vue Router 5
- **构建工具**: Vite (通过 Quasar CLI)
- **样式**: SCSS
- **代码规范**: ESLint + Prettier

## 项目结构

```bash
cat-admin/
├── src/
│   ├── api/              # API 接口定义
│   ├── boot/             # 启动文件（Pinia、认证）
│   ├── components/       # 公共组件
│   ├── layouts/          # 布局组件
│   ├── pages/            # 页面组件
│   │   ├── IndexPage.vue       # 首页数据看板
│   │   ├── DataPage.vue        # 数据管理页面
│   │   ├── OperationPage.vue   # 操作台页面
│   │   └── LoginPage.vue       # 登录页面
│   ├── router/           # 路由配置
│   └── App.vue           # 根组件
├── public/               # 静态资源
├── quasar.config.ts      # Quasar 配置
└── package.json          # 项目依赖
```

## 环境要求

- Node.js: >= 22.12 或 >= 24 或 >= 26 或 >= 28
- npm: >= 6.13.4
- yarn: >= 1.21.1 或 pnpm: >= 10.0.0

## 安装

```bash
# 使用 yarn
yarn install

# 或使用 npm
npm install

# 或使用 pnpm
pnpm install
```

## 开发

```bash
# 启动开发服务器（热重载、错误报告）
yarn dev
# 或
npm run dev
# 或
quasar dev
```

开发服务器启动后会自动打开浏览器访问 `http://localhost:5200`。

### 开发环境代理配置

项目配置了开发环境 API 代理，所有请求转发到本地网关服务（端口 5000）：

- `/api` → `http://localhost:5000/api`
- `/webauthn` → `http://localhost:5000/webauthn`

## 代码规范

```bash
# 代码检查
yarn lint

# 代码格式化
yarn format
```

## 构建

```bash
# 构建生产版本
yarn build
# 或
quasar build
```

构建产物将输出到 `dist/spa` 目录。

## API 接口

系统提供以下 API 模块：

### 猫咪管理 (`catApi`)

- `list(page, pageSize)` - 分页获取猫咪列表
- `get(id)` - 获取单个猫咪详情
- `create(cat)` - 创建猫咪
- `update(id, cat)` - 更新猫咪信息
- `delete(id)` - 删除猫咪

### 设施管理 (`siteApi`)

- `list(page, pageSize)` - 分页获取设施列表
- `get(id)` - 获取单个设施详情
- `create(site)` - 创建设施
- `update(id, site)` - 更新设施信息
- `delete(id)` - 删除设施

### 猫咪操作记录 (`catActionApi`)

- `list(page, pageSize)` - 分页获取操作记录
- `get(id)` - 获取单个操作详情
- `getByCat(catId)` - 获取指定猫咪的操作记录
- `getBySite(siteId)` - 获取指定设施的操作记录
- `getByUser(userId)` - 获取指定用户的操作记录
- `create(action)` - 创建操作记录

**操作类型**: 测体温、绝育、体检、驱虫、修剪指甲、洗澡、疫苗

### 猫咪事件记录 (`catEventApi`)

- `list(page, pageSize)` - 分页获取事件记录
- `get(id)` - 获取单个事件详情
- `getByCat(catId)` - 获取指定猫咪的事件记录
- `getBySite(siteId)` - 获取指定设施的事件记录
- `create(event)` - 创建事件记录
- `update(id, event)` - 更新事件记录
- `delete(id)` - 删除事件记录

**事件类型**: 生病、受伤、怀孕、分娩、死亡、合同解除

### 猫咪状态监控 (`catFsmApi`)

- `list(page, pageSize)` - 分页获取状态数据
- `get(id)` - 获取单个状态详情
- `getBySite(siteId)` - 获取指定设施的状态数据

### 设施状态监控 (`siteFsmApi`)

- `list(page, pageSize)` - 分页获取状态数据
- `get(id)` - 获取单个状态详情
- `getBySite(siteId)` - 获取指定设施的状态数据

### 设施操作记录 (`siteActionApi`)

- `list(page, pageSize)` - 分页获取操作记录
- `get(id)` - 获取单个操作详情
- `getBySite(siteId)` - 获取指定设施的操作记录
- `getByUser(userId)` - 获取指定用户的操作记录
- `create(action)` - 创建操作记录

**操作类型**: 消毒、喂食、喂水、逗猫、清理猫砂

## 配置说明

### Quasar 配置

项目配置文件：`quasar.config.ts`

主要配置项：

- **路由模式**: Hash 模式
- **TypeScript**: 严格模式启用
- **Quasar 插件**: Notify（通知）、Dialog（对话框）
- **图标集**: Material Icons
- **字体**: Roboto Font

详细配置请参考 [Quasar 配置文档](https://v2.quasar.dev/quasar-cli-vite/quasar-config-file)。

## 浏览器支持

项目构建目标为 `baseline-widely-available`，支持所有主流浏览器的最新版本。

## 许可证

MIT License

Copyright (c) 2026 Core2002
