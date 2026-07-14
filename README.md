# Personal-Assistant

个人助手仓库。当前主要应用为 **任务与健康计划**（`task-planner/`）。

详见：[task-planner/README.md](./task-planner/README.md)

**服务器用 Git 源码直接部署（摘要）：**

```bash
git clone https://github.com/GNoMD/Personal-Assistant.git
cd Personal-Assistant/task-planner
npm run install:all && npm run build
cp .env.example .env   # 编辑并修改 JWT_SECRET
./start.sh             # Windows 用 start.bat
```

完整步骤、更新方式、PM2 / Nginx 见 README「部署到服务器」一节。
