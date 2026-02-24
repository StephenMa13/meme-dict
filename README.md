# 📖 本地梗词典 (Offline Meme Dictionary)

这是一个基于 Vue 3 + Vite 开发的**纯离线、支持 PWA 安装**的移动端梗百科全书！📱

## ✨ 核心亮点

* **🚀 极速离线体验：** 斩断后端依赖，使用 LocalStorage 本地存储，断网也能秒开！
* **📱 桌面级 PWA 支持：** 完美适配手机端，可直接“添加到主屏幕”，享受原生 App 般的丝滑体验。
* **🎨 萌系 UI 与自动分类：** 根据不同词条标签（萌系、科技、二次元等），自动匹配专属背景色与可爱 Emoji 头像。
* **⚡️ CI/CD 自动化部署：** 接入 Netlify 流水线，代码提交后全自动构建并发布至全球 CDN。

## 🛠️ 技术栈

* **前端框架：** Vue 3 (Composition API)
* **构建工具：** Vite
* **离线化技术：** PWA (vite-plugin-pwa), LocalStorage
* **部署平台：** Netlify

## 🚀 如何在本地运行？

1. 克隆本项目到本地：
   \`\`\`bash
   git clone https://github.com/你的用户名/meme-dict.git
   \`\`\`
2. 进入项目目录并安装依赖：
   \`\`\`bash
   cd frontend
   npm install
   \`\`\`
3. 启动开发服务器：
   \`\`\`bash
   npm run dev
   \`\`\`
4. 浏览器访问 `http://localhost:5173` 即可！

## 📄 开源协议

本项目采用 MIT 协议开源。