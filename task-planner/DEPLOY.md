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

私密配置只放服务器本地 `.env`（勿提交仓库）。

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

## 防火墙

```bash
# firewalld
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload
```

云服务器还需在**安全组**放行 3001 或 80/443。

## 数据备份

定期备份 `data/tasks.db` 即可。更完整说明见 [README.md](./README.md)。
