# 处方审查助手（Web版）

基于 Next.js + Supabase + Tailwind CSS 构建的处方随机审查系统，帮助医疗机构高效完成处方质量抽查与追溯。

## ✨ 功能特性

- 📋 **处方数据查询**：按时间范围、科室筛选处方，展示汇总统计
- 🎲 **随机审查模式**：设定审查数量，系统随机抽取未审查处方
- ✅ **审查操作**：支持“通过”/“不通过”，不通过需填写原因
- 📊 **实时进度**：展示当前审查进度、通过/不通过计数
- 📑 **审查报告**：自动生成包含科室统计、不通过明细的完整报告
- 📎 **Excel 导出**：一键导出审查报告为 Excel 文件
- 🔄 **会话持久化**：审查记录实时保存，意外退出后可恢复
- 📜 **历史记录**：查看所有历史审查会话及详细报告

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 架构 | Monorepo (pnpm workspaces + Turborepo) |
| 前端框架 | Next.js 14+ (App Router) |
| UI 组件库 | shadcn/ui + Radix UI |
| 样式 | Tailwind CSS v3 |
| 后端服务 | Supabase (PostgreSQL + RESTful API) |
| 状态管理 | Zustand |
| 类型安全 | TypeScript |
| 构建工具 | Vite (共享包) |
| Excel 导出 | exceljs (服务端) |

## 📁 项目结构

```
prescription-review-web/
├── apps/
│   └── web/                   # Next.js 主应用
│       ├── src/
│       │   ├── app/           # App Router 页面
│       │   ├── components/    # 页面组件
│       │   ├── hooks/         # 自定义 Hooks
│       │   ├── stores/        # Zustand 状态
│       │   ├── services/      # Supabase 数据服务
│       │   └── lib/           # 工具函数（Supabase 客户端等）
│       ├── public/            # 静态资源
│       └── package.json
├── packages/
│   ├── ui/                    # 共享 UI 组件库
│   └── shared/                # 共享类型与常量
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- pnpm >= 9.x
- Supabase 账号（免费）

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/liyasoft/prescription-review-web.git
   cd prescription-review-web
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置 Supabase**
    - 在 [Supabase](https://supabase.com) 创建新项目
    - 执行需求说明书中的建表 SQL（`prescriptions`、`prescription_items`、`review_sessions`、`review_records`）
    - 复制项目 URL 和 Anon Key

4. **配置环境变量**
    - 进入 `apps/web` 目录，复制 `.env.example` 为 `.env.local`
    - 填入你的 Supabase 配置：
      ```env
      NEXT_PUBLIC_SUPABASE_URL=你的项目URL
      NEXT_PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
      ```

5. **启动开发服务器**
   ```bash
   pnpm dev
   ```
   访问 [http://localhost:3000](http://localhost:3000)

## 📦 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动所有包的开发模式（Turborepo 并行） |
| `pnpm build` | 构建生产版本 |
| `pnpm lint` | 代码检查 |
| `pnpm type-check` | TypeScript 类型检查 |
| `pnpm clean` | 清理所有构建产物 |

## 🌐 部署

推荐部署到 **Vercel**（原生支持 Next.js + Turborepo）：

1. 将代码推送到 GitHub 仓库
2. 在 Vercel 导入项目
3. 添加环境变量 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 部署完成

数据库继续使用 Supabase 云服务，无需额外配置。

## 📄 许可证

[MIT](./LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

## 📧 联系方式

如有问题，请通过 [项目 Issues](https://github.com/liyasoft/prescription-review-web/issues) 反馈。