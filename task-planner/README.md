# 个人助手

前后端分离的个人健康管理应用：任务清单、食谱、健身器械图鉴、旅行计划，支持登录隔离、实时同步与团队协作。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + React Router |
| 后端 | Node.js + Express + Socket.io |
| 数据库 | SQLite（better-sqlite3） |
| 认证 | JWT + bcrypt |

## 功能概览

| 模块 | 路径 | 说明 |
|------|------|------|
| 登录入口 | `/` | 注册 / 登录；注册后自动种子约 365 天个人任务 |
| 任务清单 | `/my-tasks` | 日历选日、完成打卡、增删改；可手填或从食谱 / 器械 / 旅行一键带入 |
| 食谱库 | `/recipes` | 全员共享系统菜谱 + 个人定制；筛选、搜索、收藏、详情 |
| 菜单 | `/recipes?tab=menus`、`/menus/:id` | 将多道食谱组合成私有菜单；可在任务中一键带入 |
| 健身器械 | `/equipment` | 场馆主力器械介绍、动作要点与教学视频 |
| 旅行计划 | `/travel` | 福建九市可选；目前完善厦门半日 / 一日 / 两日游 |
| 用户管理 | `/users` | **仅系统管理员**可见；查看全部注册用户与角色 |

### 任务清单

- 按日期查看与勾选任务，支持月历进度
- 新增任务时可选择来源：**手填**、**食谱库**、**菜单**、**健身器械**、**旅行计划**
- 从内容库选择后自动填充标题、分类、耗时与详情，仍可再改
- 同一账号多端通过 WebSocket 实时同步
- 操作写入审计日志；支持团队邀请码协作

### 食谱

- **食谱库**：全员共享的早餐 / 午餐 / 晚餐 / 加餐 / 饮品等；个人定制食谱仅自己可见；新用户注册只种子任务清单
- **菜单**：在食谱库「菜单」页组合多道食谱；仅自己可见，可收藏与带入任务

### 健身器械

- 卧推架、史密斯、哈克深蹲、深蹲架、髋外展/内收、高位下拉/划船、龙门架等
- 含肌群说明、使用步骤与 B 站教学嵌入

### 旅行计划

- 城市范围：福建（厦门、福州、泉州、漳州、莆田、三明、南平、龙岩、宁德）
- 每种出行天数（半日 / 一日 / 两日 / 三日 / 四日 / 五日及以上）每市至少 8 条推荐；数据在前端 `src/data/travel*.js`

## 本地开发

> 环境建议：Node.js **≥ 18**，npm **≥ 9**（系统若停在 npm 6，请先升级，否则 lockfile v3 可能装不全依赖）。

```bash
# 安装依赖
cd task-planner
npm run install:all

# 后端 :13222（也可在 .env 中改 PORT）
cd backend && npm start

# 前端 :5173（另开终端）
cd frontend && npm run dev
```

浏览器打开 http://localhost:5173 。启动后会自动创建管理员账号 `gnomd`（也可自行注册新账号）。

### 冷启动数据（无需上传本地数据库）

| 内容 | 是否需要提交 | 冷启动如何获得 |
|------|--------------|----------------|
| `tasks.db` / `data/` | **不要提交**（含密码哈希） | 后端首次启动自动建库 |
| 共享食谱库 | 模板代码已提交 | 启动时 / `npm run seed` 写入 SQLite |
| 默认管理员 `gnomd` | 不提交账号本身 | 启动时自动创建（引导密码仅首次写入，不以明文进配置示例） |
| 任务清单 | 模板代码已提交 | **gnomd 初始化种子**；其它账号在注册时种子约 365 天 |
| 旅行计划 / 器械 | 前端 JS + `public/` 图片已提交 | 打开对应页面即可 |
| `frontend/dist`、`release/` | **不要提交** | `npm run build` / `npm run pack` 本地生成 |
| `.env` | **不要提交** | 复制 `.env.example` 后改 `JWT_SECRET` |

也可在根目录分别执行：

```bash
cd task-planner/backend && npm install && npm start
cd task-planner/frontend && npm install && npm run dev
```

## 部署到服务器

生产环境由后端同时提供 API 与前端静态资源（构建后的 `frontend/dist`），默认端口 **13222**。

### 环境要求

- Node.js **≥ 18**（推荐 20 LTS），npm **≥ 9**
- Git
- Linux 上编译 `better-sqlite3` 可能需要：`build-essential`（或等价的 gcc/make/python3）

### 方式一：Git 源码部署

```bash
# 1. 拉取仓库
git clone https://github.com/GNoMD/Personal-Assistant.git
cd Personal-Assistant/task-planner

# 2. 安装依赖并构建前端（生成 frontend/dist）
npm run install:all
npm run build

# 3. 配置环境变量（生产务必修改 JWT_SECRET）
cp .env.example .env
nano .env   # 或 vim / vi

# 4. 启动（后端会托管前端静态页 + API，默认 :13222）
chmod +x start.sh
./start.sh
```

Windows Server 可用：

```bat
git clone https://github.com/GNoMD/Personal-Assistant.git
cd Personal-Assistant\task-planner
npm run install:all
npm run build
copy .env.example .env
REM 编辑 .env，修改 JWT_SECRET
start.bat
```

首次启动会自动建库、写入共享食谱，并创建管理员账号 `gnomd`（也可自行注册）。

#### 更新到最新代码

```bash
cd Personal-Assistant
git pull
cd task-planner
npm run install:all
npm run build
# 若用 PM2：
pm2 restart task-planner
# 若用前台脚本：停掉旧进程后重新 ./start.sh
```

> `data/tasks.db` 在仓库外本地生成，`git pull` 不会覆盖用户数据；更新前仍建议备份数据库。

#### 后台常驻（PM2）

在完成上面的 `install:all`、`build`、配置 `.env` 之后：

```bash
npm install -g pm2
cd /path/to/Personal-Assistant/task-planner
pm2 start backend/src/index.js --name task-planner --cwd backend
pm2 save
pm2 startup
```

访问：

| 场景 | 地址 |
|------|------|
| 本机 | http://localhost:13222 |
| 局域网 / 公网 | http://\<服务器IP\>:13222 |
| 健康检查 | `GET /api/health` |

云服务器请在安全组放行 **13222**（或下方 Nginx 的 80/443）。

### 方式二：日常更新包（推荐手动上传）

只传编译前端 + 后端源码（不含 node_modules；默认也不含食材/器械大图）：

```bat
cd task-planner
npm run pack:update
REM → release/task-planner-update.tar.gz（约 1～3 MB）
```

服务器在安装目录上一级解压覆盖后重启；保留 `.env`、`data/`、`backend/node_modules`。

改大图：`npm run pack:update:media`。首次或改依赖：`npm run pack:offline`。细则见 [DEPLOY.md](./DEPLOY.md)。

### 方式三：全离线包 / SSH 一键（可选）

```bash
npm run pack:offline   # 含 Linux node_modules，体积大
# 或配置 .deploy.env 后: npm run deploy
```

### 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `PORT` | 监听端口 | `13222` |
| `HOST` | 监听地址 | `0.0.0.0` |
| `JWT_SECRET` | JWT 签名密钥 | 开发默认值（**生产必改**） |
| `ADMIN_USERNAMES` | 系统管理员用户名（逗号分隔） | `gnomd` |
| `DB_PATH` | SQLite 路径 | `data/tasks.db` |

> 私密项只写在服务器本地的 `.env`（已 gitignore），不要写进仓库或 `.env.example`。

### Nginx 反向代理（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:13222;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

WebSocket（`/socket.io`）依赖上述 Upgrade 头。

### 数据备份

定期备份 `data/tasks.db`。更细的部署说明见同目录 [DEPLOY.md](./DEPLOY.md)。

## API 摘要

均需登录的接口请带 `Authorization: Bearer <token>`。

| 模块 | 示例 |
|------|------|
| 认证 | `POST /api/auth/register`、`/login`；`GET /api/auth/me` |
| 任务 | `GET/POST /api/tasks`；`PATCH/DELETE /api/tasks/:id`；月历 `GET /api/tasks/calendar` |
| 食谱 | `GET/POST /api/recipes`；`GET/PATCH/DELETE /api/recipes/:id` |
| 菜单 | `GET/POST /api/menus`；`GET/PATCH/DELETE /api/menus/:id` |
| 审计 / 团队 | `GET /api/audit/recent`；`POST /api/teams`、`/teams/join` |
| WebSocket | `/socket.io`，`auth: { token }`，事件 `task:sync` |

## 数据与目录

| 项目 | 说明 |
|------|------|
| 数据库 | `task-planner/data/tasks.db` |
| 主要表 | `users`、`tasks`、`task_audit_log`、`recipes`、`menus`、`menu_items` 等 |

```
task-planner/
├── backend/src/          # API、认证、种子数据、Socket
├── frontend/src/
│   ├── pages/            # 入口、任务、食谱、器械、旅行
│   ├── components/       # 导航、任务表单、列表等
│   ├── data/             # 器械、旅行静态数据
│   └── utils/            # 任务内容库映射等
├── data/                 # SQLite（需可写）
├── DEPLOY.md             # 部署细则
└── package.json          # install:all / build / pack / deploy / start
```

## 测试

```bash
cd task-planner/backend && npm test
cd task-planner/frontend && npm test
```
