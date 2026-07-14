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
| 其他食谱 | `/other-recipes` | 一周豆浆轮换；先选周再选日，查看配方详情 |
| 健身器械 | `/equipment` | 场馆主力器械介绍、动作要点与教学视频 |
| 旅行计划 | `/travel` | 福建九市可选；目前完善厦门半日 / 一日 / 两日游 |
| 用户管理 | `/users` | **仅系统管理员**可见；查看全部注册用户与角色 |

### 任务清单

- 按日期查看与勾选任务，支持月历进度
- 新增任务时可选择来源：**手填**、**食谱库**、**其他食谱**、**健身器械**、**旅行计划**
- 从内容库选择后自动填充标题、分类、耗时与详情，仍可再改
- 同一账号多端通过 WebSocket 实时同步
- 操作写入审计日志；支持团队邀请码协作

### 食谱

- **食谱库**：全员共享的早餐 / 午餐 / 晚餐 / 加餐 / 饮品等；个人定制食谱仅自己可见；新用户注册只种子任务清单
- **其他食谱**：豆浆轮换合集（含统一红线、功效与饮用须知），按周卡片浏览

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

# 后端 :3001
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

生产环境由后端同时提供 API 与前端静态资源（构建后的 `frontend/dist`），默认端口 **3001**。

### 1. 打发布包（在开发机）

```bash
cd task-planner
npm run install:all
npm run pack
```

生成 `release/task-planner.zip`（含后端、前端构建产物、启动脚本与 `DEPLOY.md`）。

### 2. 上传并启动

**Linux**

```bash
unzip task-planner.zip
cd task-planner
cp .env.example .env
# 编辑 .env，务必修改 JWT_SECRET
chmod +x start.sh
./start.sh
```

**Windows**

```bat
解压 task-planner.zip
cd task-planner
copy .env.example .env
REM 编辑 .env，修改 JWT_SECRET
start.bat
```

访问：

| 场景 | 地址 |
|------|------|
| 本机 | http://localhost:3001 |
| 局域网 / 公网 | http://\<服务器IP\>:3001 |
| 健康检查 | `GET /api/health` |

### 3. 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `PORT` | 监听端口 | `3001` |
| `HOST` | 监听地址 | `0.0.0.0` |
| `JWT_SECRET` | JWT 签名密钥 | 开发默认值（**生产必改**） |
| `ADMIN_USERNAMES` | 系统管理员用户名（逗号分隔） | `gnomd` |
| `DB_PATH` | SQLite 路径 | `data/tasks.db` |

### 4. Nginx 反向代理（推荐）

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

WebSocket（`/socket.io`）依赖上述 Upgrade 头。云服务器请在安全组放行 80/443 或 3001。

### 5. 后台常驻（PM2）

```bash
npm install -g pm2
cd task-planner/backend
npm install --omit=dev
cd ..
pm2 start backend/src/index.js --name task-planner --cwd backend
pm2 save
pm2 startup
```

### 6. 数据备份

定期备份 `data/tasks.db`。更细的部署说明见同目录 [DEPLOY.md](./DEPLOY.md)。

## API 摘要

均需登录的接口请带 `Authorization: Bearer <token>`。

| 模块 | 示例 |
|------|------|
| 认证 | `POST /api/auth/register`、`/login`；`GET /api/auth/me` |
| 任务 | `GET/POST /api/tasks`；`PATCH/DELETE /api/tasks/:id`；月历 `GET /api/tasks/calendar` |
| 食谱 | `GET/POST /api/recipes`；`GET/PATCH/DELETE /api/recipes/:id`（`?source=other` 为其他食谱） |
| 审计 / 团队 | `GET /api/audit/recent`；`POST /api/teams`、`/teams/join` |
| WebSocket | `/socket.io`，`auth: { token }`，事件 `task:sync` |

## 数据与目录

| 项目 | 说明 |
|------|------|
| 数据库 | `task-planner/data/tasks.db` |
| 主要表 | `users`、`tasks`、`task_audit_log`、`recipes` 等 |

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
└── package.json          # install:all / build / pack / start
```

## 测试

```bash
cd task-planner/backend && npm test
cd task-planner/frontend && npm test
```
