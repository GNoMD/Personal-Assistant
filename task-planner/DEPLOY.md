# 服务器部署指南

生产环境由后端同时提供 API 与前端静态页（`frontend/dist`），默认端口 **13222**。
日常发版以**手动上传发布包**为主：分 **少量更新** 与 **全量更新** 两种操作方式。

## 环境要求

- **Node.js 18+**（推荐 20 LTS），npm **≥ 9**
- **Git**（源码部署时）
- Linux 编译原生模块可能需要：`build-essential`（gcc / make / python3）
- 无需单独部署 Nginx（可直接用 Node 对外服务）；生产环境建议 Nginx 反代 + HTTPS

---

## 先选哪种包？

| 类型 | 开发机命令 | 产物 | 体积 | 何时用 |
|------|------------|------|------|--------|
| **少量更新** | `npm run pack:update` | `release/task-planner-update.tar.gz` | 约 1～3 MB | **日常改代码/UI**（服务器已有 `node_modules`） |
| **少量更新 + 大图** | `npm run pack:update:media` | 同上 | 更大 | 改了 `ingredients/`、`equipment/` 静态图 |
| **全量更新** | `npm run pack:offline` | `release/task-planner-offline-linux.tar.gz` | 较大 | **首次部署**、改了依赖、`node_modules` 损坏、换机器 |

> 勿用 Windows「压缩」或 `Compress-Archive` 打 zip（路径分隔符会导致 Linux 解压后模块找不到）。

**更新时务必保留服务器上的：** `.env`、`data/`（含 `tasks.db`）、以及少量更新时的 `backend/node_modules/`。

---

## 少量更新（日常推荐）

只覆盖 **已编译前端** `frontend/dist` + **后端源码**，**不含** `node_modules` / `data` / `.env`。

### 1. 开发机打包

```bat
cd task-planner
npm run pack:update
REM → release/task-planner-update.tar.gz

REM 若本次改了食材/器械大图：
npm run pack:update:media
```

把 `task-planner-update.tar.gz` 上传到服务器（与现网 `task-planner` 同级目录，或任意临时目录）。

### 2. 服务器停服 → 解压覆盖 → 启动

假设现网目录为 `/home/ubuntu/soft/person-assistant/task-planner`：

```bash
cd /home/ubuntu/soft/person-assistant/task-planner

# 停服务（start.sh 后台模式）
if [ -f data/task-planner.pid ]; then
  kill "$(cat data/task-planner.pid)" 2>/dev/null || true
  rm -f data/task-planner.pid
fi
# 若用 PM2： pm2 stop task-planner

# 备份数据库（建议）
cp data/tasks.db "data/tasks.db.bak.$(date +%Y%m%d%H%M%S)"

# 在「含 task-planner 目录」的上一级解压覆盖
cd /home/ubuntu/soft/person-assistant
tar -xzf /path/to/task-planner-update.tar.gz

cd task-planner
# 确认 .env、data/、backend/node_modules 仍在

chmod +x start.sh
./start.sh
# 后台启动；日志：logs/task-planner.log ；PID：data/task-planner.pid
# 若用 PM2： pm2 restart task-planner
```

### 3. 需要补库数据时（按发版说明）

多数改动重启即可。若发版要求写入新种子数据（例如一周豆浆菜单），在**重启后**执行：

```bash
cd /home/ubuntu/soft/person-assistant/task-planner/backend
DB_PATH=../data/tasks.db npm run seed:soy-week
DB_PATH=../data/tasks.db npm run seed:soy-week -- --yes
```

其它仅同步 `gnomd` 任务见下文「仅更新线上 gnomd 任务」。

### 少量更新检查清单

- [ ] 开发机已 `pack:update`（或 `pack:update:media`）
- [ ] 已停服
- [ ] 已备份 `data/tasks.db`
- [ ] 解压后 `.env` / `data/` / `backend/node_modules` 仍在
- [ ] `./start.sh` 或 `pm2 restart` 成功
- [ ] 浏览器强刷后访问正常；`GET /api/health` 正常
- [ ] 若发版要求：已跑对应 `seed:*` / `sync:gnomd` 脚本

---

## 全量更新（首次 / 改依赖）

含 Linux 版 `backend/node_modules`（含 `better-sqlite3` 预编译），服务器**不需要**再 `npm install`。

### 1. 开发机打包

```bash
cd task-planner
npm run install:all   # 首次或依赖变更时
npm run pack:offline
# → release/task-planner-offline-linux.tar.gz
```

可选：与服务器 Node 主版本对齐：

```powershell
$env:PACK_NODE_TARGET="20.18.0"
npm run pack:offline
```

ARM 服务器：`PACK_ARCH=arm64 npm run pack:offline`

### 2. 服务器停服 → 解压覆盖 → 启动

```bash
cd /home/ubuntu/soft/person-assistant/task-planner

if [ -f data/task-planner.pid ]; then
  kill "$(cat data/task-planner.pid)" 2>/dev/null || true
  rm -f data/task-planner.pid
fi

cp .env ".env.bak.$(date +%Y%m%d%H%M%S)" 2>/dev/null || true
cp data/tasks.db "data/tasks.db.bak.$(date +%Y%m%d%H%M%S)"

cd /home/ubuntu/soft/person-assistant
tar -xzf /path/to/task-planner-offline-linux.tar.gz

cd task-planner
# 通常包内不含 .env / data，保留原文件即可
chmod +x start.sh
./start.sh
```

首次部署若没有 `.env`：

```bash
cp .env.example .env
# 编辑 .env，务必修改 JWT_SECRET
chmod +x start.sh && ./start.sh
```

### 全量更新检查清单

- [ ] 服务器 Node **主版本**与打包目标一致（`node -v`）
- [ ] 已停服并备份 `.env`、`data/tasks.db`
- [ ] 使用 `tar -xzf` 解压（不要手搓 zip）
- [ ] `./start.sh` 后台启动成功；查看 `logs/task-planner.log`
- [ ] `/api/health` 正常；登录抽查

---

## 启停与日志（start.sh）

`start.sh` 为**后台启动**（`nohup`）：

| 文件 | 说明 |
|------|------|
| `data/task-planner.pid` | 进程 PID |
| `logs/task-planner.log` | 标准输出/错误日志 |

```bash
chmod +x start.sh && ./start.sh
tail -f logs/task-planner.log
kill "$(cat data/task-planner.pid)" && rm -f data/task-planner.pid
```

若提示「已在运行中」，需先停止再启动。也可用 PM2 托管，与 `start.sh` 二选一。

---

## 包类型对照

| 包 | 命令 | 内容 | 服务器 npm install |
|----|------|------|-------------------|
| 少量更新 | `npm run pack:update` | dist + 后端源码（默认不含大图） | 不需要（沿用现有 modules） |
| 少量更新+图 | `npm run pack:update:media` | 含 ingredients/equipment | 不需要 |
| 全离线 | `npm run pack:offline` | 含 Linux node_modules | **不需要** |
| 轻量完整包 | `npm run pack` | 无 node_modules | 需要（`start.sh` 会装） |

---

## 方式一：Git 源码部署

在服务器上直接克隆仓库、构建并启动：

```bash
git clone https://github.com/GNoMD/Personal-Assistant.git
cd Personal-Assistant/task-planner

npm run install:all
npm run build

cp .env.example .env
# 编辑 .env，务必修改 JWT_SECRET

chmod +x start.sh
./start.sh
```

Windows：

```bat
git clone https://github.com/GNoMD/Personal-Assistant.git
cd Personal-Assistant\task-planner
npm run install:all
npm run build
copy .env.example .env
REM 编辑 .env，修改 JWT_SECRET
start.bat
```

首次启动会自动创建 SQLite、写入共享食谱库，并初始化管理员 `gnomd`。

### 更新

```bash
cd Personal-Assistant
git pull
cd task-planner
npm run install:all
npm run build
kill "$(cat data/task-planner.pid)" 2>/dev/null; rm -f data/task-planner.pid
./start.sh
# 或: pm2 restart task-planner
```

`data/tasks.db` 不会被 git 覆盖；更新前仍建议备份。

### 仅更新线上 gnomd 任务（不动其他用户）

代码更新后若只需把最新用药时序同步到管理员 `gnomd`：

```bash
cd Personal-Assistant/task-planner/backend

# 备份
cp "${DB_PATH:-../data/tasks.db}" "${DB_PATH:-../data/tasks.db}.bak.$(date +%Y%m%d%H%M%S)"

# 预览（不写库）
DB_PATH=/path/to/tasks.db npm run sync:gnomd

# 只同步用药三次 + 护理文案（推荐，保留 gnomd 完成打卡）
DB_PATH=/path/to/tasks.db npm run sync:gnomd -- --mode=meds --yes

# 整表按模板重建 gnomd 任务（会清空该账号完成状态）
DB_PATH=/path/to/tasks.db npm run sync:gnomd -- --mode=full --yes
```

脚本硬编码目标用户名为 `gnomd`，写库后会校验其他用户任务总数不变。

### 补种一周豆浆菜单（需要时）

```bash
cd Personal-Assistant/task-planner/backend
DB_PATH=../data/tasks.db npm run seed:soy-week          # 预览
DB_PATH=../data/tasks.db npm run seed:soy-week -- --yes # 写库
```

### PM2 常驻

```bash
npm install -g pm2
cd /path/to/Personal-Assistant/task-planner
pm2 start backend/src/index.js --name task-planner --cwd backend
pm2 save
pm2 startup
```

一键部署若检测到已有同名 pm2 进程，会自动 `pm2 restart`。

---

## 方式二：发布包部署（轻量）

发布包已含构建好的前端，服务器可不跑 `npm run build`，但仍需一次 `npm install`（`start.sh` 自动执行）：

```
task-planner/
├── backend/          # Node.js 后端源码（无 node_modules）
├── frontend/dist/    # 前端静态资源（已构建）
├── data/             # SQLite 数据库目录（需可写）
├── start.sh
├── start.bat
├── .env.example
└── DEPLOY.md
```

开发机：

```bash
cd task-planner
npm run install:all
npm run pack
# 得到 release/task-planner.zip
```

服务器：

```bash
unzip task-planner.zip
cd task-planner
cp .env.example .env
# 编辑 .env，修改 JWT_SECRET
chmod +x start.sh
./start.sh
```

---

## 方式三：全离线包补充说明

适合没有 SSH、只能网盘/FTP 传文件的场景。有 SSH 时优先用 **方式零**。

### 开发机（Windows）

```bash
cd task-planner
npm run install:all
npm run pack:offline
# → release/task-planner-offline-linux.tar.gz（推荐）
```

可选：指定与服务器一致的 Node 版本：

```powershell
$env:PACK_NODE_TARGET="20.18.0"
npm run pack:offline
```

### 服务器（Ubuntu）

```bash
tar -xzf task-planner-offline-linux.tar.gz
cd task-planner
cp .env.example .env    # 更新时请保留已有 .env 与 data/
chmod +x start.sh && ./start.sh
```

> 勿用 Windows「压缩」或 `Compress-Archive` 手动打 zip：会写入 `\` 路径，Linux 解压后出现 `Cannot find module .../engine.io-parser/...`。

| 注意 | 说明 |
|------|------|
| Node 版本 | 服务器 Node **主版本**须与打包目标一致（可用 `PACK_NODE_TARGET` 指定） |
| 保留文件 | 更新时不要覆盖服务器 `.env`、`data/tasks.db` |
| 架构 | 默认 `x64`；ARM 服务器设 `PACK_ARCH=arm64` |

| 包类型 | 命令 | 服务器是否需要 npm install |
|--------|------|----------------------------|
| 轻量包 | `npm run pack` | 需要 |
| 全离线 Linux | `npm run pack:offline` | **不需要** |

---

## 访问地址

| 场景 | 地址 |
|------|------|
| 本机 | http://localhost:13222 |
| 局域网 | http://\<服务器内网IP\>:13222 |
| 公网 | http://\<公网IP\>:13222 或配置域名后 https://your-domain.com |

健康检查：`GET /api/health`

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `PORT` | 监听端口 | 13222 |
| `HOST` | 监听地址 | 0.0.0.0 |
| `JWT_SECRET` | JWT 签名密钥 | 内置开发密钥（**生产必改**） |
| `ADMIN_USERNAMES` | 系统管理员用户名（逗号分隔） | `gnomd` |
| `DB_PATH` | SQLite 文件路径 | `data/tasks.db` |
| `OPENCLAW_ENABLED` | 是否启用智能助手 | `true` |
| `OPENCLAW_RESPONSES_URL` | OpenClaw Responses API 完整地址 | 无 |
| `OPENCLAW_GATEWAY_TOKEN` | Gateway Bearer Token（仅服务端） | 无 |
| `OPENCLAW_AGENT_ID` | OpenClaw Agent ID | `main` |
| `OPENCLAW_MODEL` | Agent 目标模型 | `openclaw/default` |
| `OPENCLAW_TIMEOUT_MS` | 单次响应超时（毫秒） | `120000` |
| `OPENCLAW_CONTEXT_CHAR_LIMIT` | 每用户固定 OpenClaw 窗口近似容量，超限才轮换 | `120000` |

私密配置只放服务器本地 `.env`（勿提交仓库）。

### OpenClaw

当前部署的 Responses API：

```text
http://119.45.160.179:16136/v1/responses
```

OpenClaw 需要启用 `gateway.http.endpoints.responses.enabled=true`。Task Planner
只从后端访问该地址，浏览器不会获得 Gateway Token。可通过登录后的
`GET /api/assistant/health` 查看配置状态，或由管理员/运维调用
`POST /api/assistant/health/probe` 验证真实连接。

每个登录用户在 OpenClaw 侧使用**固定窗口键**
`taskplanner-user-<userId>-w<gen>`：前端「新对话」只开本地历史，不会新建
OpenClaw 窗口；只有估算上下文接近上限，或 Gateway 返回上下文溢出时，
才会在该用户下把 `w` 代际加一并重试。

当前地址为 HTTP，只适合开发联调。生产环境必须改为 HTTPS 或仅通过
内网/VPN/Tailscale 访问，否则 Bearer Token 会在网络中明文传输。

`/octb0y` 是 Control UI 的浏览器路由，不属于 Gateway API。实测向
`/octb0y/v1/responses` 发起 POST 会返回 404，而根路径
`/v1/responses` 会进入 OpenClaw 认证并在无 Token 时返回 401。

## Nginx 反向代理（推荐）

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

WebSocket（实时同步）走同一路径 `/socket.io`，上述配置已包含 Upgrade 头。
智能助手流式响应走 `/api/assistant/`，若使用独立 location，需设置
`proxy_buffering off;`，避免 SSE 文本被 Nginx 缓冲。

## 防火墙

```bash
# firewalld
firewall-cmd --permanent --add-port=13222/tcp
firewall-cmd --reload
```

云服务器还需在**安全组**放行 13222 或 80/443。

## 数据备份

定期备份 `data/tasks.db` 即可。更完整说明见 [README.md](./README.md)。

## 附录：本机 SSH 一键上传（可选）

若已配置免密 SSH，也可用：

```bat
copy .deploy.env.example .deploy.env
npm run deploy
```

日常仍更推荐手动上传：

- 少量：`task-planner-update.tar.gz`
- 全量：`task-planner-offline-linux.tar.gz`
