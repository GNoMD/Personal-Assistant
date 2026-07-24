# OpenSpec

本仓库已接入 [OpenSpec](https://github.com/Fission-AI/OpenSpec)（规范驱动开发）。

## 目录

```text
openspec/
├── config.yaml          # 项目上下文与产物规则
├── specs/               # 已归档的行为规格（按域累积）
├── changes/             # 进行中的变更提案
│   └── archive/         # 已完成变更存档
└── README.md
```

**不必先写全站规格。** 每次只为「即将改动的切片」写 delta；归档后自然累积进 `specs/`。

## 日常用法（Cursor 聊天）

| 命令 | 作用 |
|------|------|
| `/opsx:explore` | 先摸清代码与方案（可选） |
| `/opsx:propose <kebab-name>` | 生成 proposal / specs / design / tasks |
| `/opsx:apply` | 按 tasks 实现 |
| `/opsx:sync` | 同步规格（需要时） |
| `/opsx:archive` | 归档并合并进 `openspec/specs/` |
| `/opsx:update` | 更新本变更产物 |

重启 IDE 后 slash 命令才会出现在 Cursor 命令面板。

## 终端 CLI

需本机已安装：`npm i -g @fission-ai/openspec@latest`

```bash
openspec list                 # 进行中的 changes
openspec list --specs         # 已有 specs
openspec show <change-name>
openspec validate <change-name>
openspec update               # 刷新 Cursor skills/commands
openspec doctor
```

## 建议域名

与 `config.yaml` 中一致：`auth` · `tasks` · `recipes` · `travel` · `fitness` · `assistant` · `ops`
