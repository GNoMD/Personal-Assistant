# 服务器部署指南

生产环境由后端同时提供 API 与前端静态页（`frontend/dist`），默认端口 **3001**。

## 环境要求

- **Node.js 18+**（推荐 20 LTS），npm **≥ 9**
- **Git**（源码部署时）
- Linux 编译原生模块可能需要：`build-essential`（gcc / make / python3）
- 无需单独部署 Nginx（可直接用 Node 对外服务）；生产环境建议 Nginx 反代 + HTTPS

## 方式一：Git 源码部署（推荐）

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
pm2 restart task-planner   # 若使用 PM2；否则重启 start.sh / start.bat
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

### PM2 常驻

```bash
npm install -g pm2
cd /path/to/Personal-Assistant/task-planner
pm2 start backend/src/index.js --name task-planner --cwd backend
pm2 save
pm2 startup
```

## 方式二：发布包部署

发布包已含构建好的前端，服务器可不跑 `npm run build`：

```
task-planner/
├── backend/          # Node.js 后端源码
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

## 访问地址

| 场景 | 地址 |
|------|------|
| 本机 | http://localhost:3001 |
| 局域网 | http://\<服务器内网IP\>:3001 |
| 公网 | http://\<公网IP\>:3001 或配置域名后 https://your-domain.com |

健康检查：`GET /api/health`

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `PORT` | 监听端口 | 3001 |
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
        proxy_pass http://127.0.0.1:3001;
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
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload
```

云服务器还需在**安全组**放行 3001 或 80/443。

## 数据备份

定期备份 `data/tasks.db` 即可。更完整说明见 [README.md](./README.md)。
