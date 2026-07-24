# 景点实拍图（不进 Git）

本目录图片体积很大，**不要提交到 Git**。

## 本地生成

在 `task-planner/frontend` 下：

```bash
npm run photos:download
# 或只补缺：
npm run photos:download:incomplete
```

图片会下载到本目录：`public/travel-spot-photos/`。

## 部署

构建前端后，把本目录整包同步到服务器静态资源对应路径即可，例如：

- 构建产物：`frontend/dist/travel-spot-photos/`
- 或直接覆盖运行目录下的 `travel-spot-photos/`

索引仍在仓库里：`src/data/travelSpotPhotoMap.js`（只有路径元数据，不含图片本体）。
