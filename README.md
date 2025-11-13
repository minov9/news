# Daily AI News

每日AI新闻自动化网站，自动抓取和总结AI相关新闻。

## 功能

- 每天早上7点自动抓取AI新闻
- 使用Gemini 2.5 Flash生成中文总结
- 现代化UI设计，支持暗色/亮色主题切换
- 响应式设计，适配各种设备

## 开发

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
```bash
cp .env.local.example .env.local
# 编辑 .env.local 添加你的 Gemini API Key
```

3. 本地开发：
```bash
npm run dev
```

4. 生成新闻数据：
```bash
npm run generate
```

## 部署

1. 推送到 GitHub
2. 连接 Vercel 项目
3. 在 Vercel 中添加环境变量 `GEMINI_API_KEY`
4. GitHub Actions 会自动每天运行

## 技术栈

- Next.js 15
- TypeScript
- Tailwind CSS
- Google Gemini AI
- GitHub Actions
- Vercel
