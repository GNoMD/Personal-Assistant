# 服务器部署指南

## 发布包内容

```
task-planner/
├── backend/          # Node.js 后端源码
├── frontend/dist/    # 前端静态资源（已构建）
├── data/             # SQLite 数据库目录（需可写）
├── start.sh          # Linux 启动脚本
├── start.bat         # Windows 启动脚本
├── .env.example      # 环境变量示例
└── DEPLOY.md
```

## 环境要求

- **Node.js 18+**（推荐 20 LTS）
- 无需单独部署 Nginx（可直接用 Node 对外服务）；生产环境建议 Nginx 反代 + HTTPS

## 快速启动

### Linux

```bash
unzip task-planner.zip
cd task-planner
cp .env.example .env
# 编辑 .env，修改 JWT_SECRET
chmod +x start.sh
./start.sh
```

### Windows

```bat
解压 task-planner.zip
cd task-planner
copy .env.example .env
REM 编辑 .env，修改 JWT_SECRET
start.bat
```

## 访问地址

启动成功后：

| 场景 | 地址 |
|------|------|
| 本机 | http://localhost:3001 |
| 局域网 | http://<服务器内网IP>:3001 |
| 公网 | http://<公网IP>:3001 或配置域名后 https://your-domain.com |

健康检查：`GET /api/health`

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `PORT` | 监听端口 | 3001 |
| `HOST` | 监听地址 | 0.0.0.0 |
| `JWT_SECRET` | JWT 签名密钥 | 内置开发密钥（**生产必改**） |
| `DB_PATH` | SQLite 文件路径 | `data/tasks.db` |

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

开放对应端口，例如：

```bash
# firewalld
firewall-cmd --permanent --add-port=3001/tcp
firewall-cmd --reload
```

云服务器还需在**安全组**放行 3001 或 80/443。

## 后台常驻（PM2）

```bash
npm install -g pm2
cd task-planner/backend
npm install --omit=dev
cd ..
pm2 start backend/src/index.js --name task-planner --cwd backend
pm2 save
pm2 startup
```

## 数据备份

定期备份 `data/tasks.db` 即可。
