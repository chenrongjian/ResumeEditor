# 在线简历编辑器 (ResumeEditor)

一个专业的 Markdown 简历编辑器，基于 Express 和 Monaco Editor 构建。支持实时预览、PDF导出、主题切换等功能。提供 Web 版本，支持离线使用。

![预览图](docs/preview.png)

## 🌐 在线使用

访问 [在线简历编辑器](https://resume-editor-phi.vercel.app/) 即可开始使用。

### 主要特性

本应用提供以下核心功能：
- 📝 Markdown 实时编辑与预览
- 🖨️ 一键导出 PDF 简历
- 🌓 支持明暗主题切换
- 💾 自动保存编辑内容
- 📱 响应式设计，支持各种设备

## ✨ 功能特点

- 📝 Markdown 实时编辑与预览
- 🔄 编辑器与预览区域同步滚动
- 📱 响应式布局设计
- 🌓 支持明暗主题切换
- 🖼️ 支持头像图片设置
- 📄 一键导出 PDF
- 💾 自动保存内容
- ⌨️ Monaco Editor 强大的编辑体验
- 🌍 支持离线使用
- 📊 SEO 优化

## 🚀 快速开始

### 环境要求

- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装

```bash
# 克隆项目
git clone https://github.com/chenrongjian/ResumeEditor.git

# 进入项目目录
cd ResumeEditor

# 安装依赖
npm install
```

### 开发

```bash
# 启动Web开发模式
npm run web-dev

# 启动Electron开发模式
npm run dev
```

### 构建

```bash
# 构建Electron应用
npm run dist
```

## 🎯 使用指南

1. **编辑简历**
   - 左侧为 Markdown 编辑区
   - 右侧为实时预览区
   - 支持标准 Markdown 语法

2. **设置头像**
   - 将头像图片放入 `image` 目录
   - 在 Markdown 中使用 `<img src="image/avatar.png" alt="avatar">` 引用

3. **导出 PDF**
   - 点击顶部导航栏的"导出PDF"按钮
   - 系统会自动生成PDF文件并下载

4. **切换主题**
   - 点击顶部导航栏的主题切换按钮
   - 支持明亮和暗黑两种主题

## ⌨️ 快捷键

- `Ctrl/Cmd + S`: 保存文档
- `Ctrl/Cmd + Z`: 撤销
- `Ctrl/Cmd + Y`: 重做
- `Ctrl/Cmd + F`: 查找
- `Ctrl/Cmd + H`: 替换

## 🔧 技术栈

- 前端框架：Express (Web版) / Electron (桌面版)
- 编辑器：Monaco Editor
- Markdown 解析：Marked.js
- PDF 导出：html2pdf.js
- 图标：Font Awesome
- 主题：自定义 CSS 变量

## 💻 部署说明

### Vercel 部署

本项目已配置为可直接部署到 Vercel 平台：

1. Fork 本仓库到您的 GitHub 账号
2. 在 Vercel 中导入该仓库
3. 使用默认设置完成部署

### 自定义域名

如果您想使用自定义域名：
1. 在 Vercel 项目设置中添加您的域名
2. 按照 Vercel 提供的说明配置 DNS 记录
3. 等待 DNS 生效（通常需要几分钟到几小时）

## 📝 模板说明

默认提供了一个基础的简历模板，包含以下部分：

- 基本信息
- 教育背景
- 工作经验
- 专业技能
- 项目经历

您可以根据需要自由修改模板内容。

### 数据存储

- 使用 LocalStorage 存储编辑内容
- 支持自动保存和恢复
- 每次刷新页面会重新加载模板（避免缓存问题）

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request。在提交 PR 之前，请确保：

1. 更新了相关的文档说明
2. 添加了必要的测试用例
3. 通过了所有的测试
4. 符合代码规范

## 🔍 浏览器支持

- Chrome >= 80
- Firefox >= 75
- Safari >= 13
- Edge >= 80

## 📄 开源协议

本项目基于 [MIT](LICENSE) 协议开源。 