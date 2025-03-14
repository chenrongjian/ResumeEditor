const express = require('express')
const path = require('path')
const app = express()
const port = process.env.PORT || 3000
const fs = require('fs')

// 添加CORS支持
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// 禁用响应缓存
app.use((req, res, next) => {
    res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    next();
});

// 静态文件服务配置
app.use(express.static(path.join(__dirname, 'web')))
app.use('/web', express.static(path.join(__dirname, 'web')))
app.use('/assets', express.static(path.join(__dirname, 'assets')))
app.use('/image', express.static(path.join(__dirname, 'web/image')))
app.use('/styles', express.static(path.join(__dirname, 'web/styles')))
app.use('/scripts', express.static(path.join(__dirname, 'web/scripts')))

// 处理template.md路由
app.get('/api/template', (req, res) => {
    const templatePath = path.join(__dirname, 'template.md');
    
    // 检查文件是否存在
    if (!fs.existsSync(templatePath)) {
        console.error('template.md 文件不存在:', templatePath);
        // 返回默认模板内容
        return res.status(200).send(`# 简历模板\n\n## 基本信息\n\n- 姓名：\n- 年龄：\n- 学历：\n- 专业：\n- 联系方式：\n\n## 教育经历\n\n## 工作经历\n\n## 项目经验\n\n## 技能特长\n\n## 个人评价`);
    }

    try {
        // 读取文件内容
        const content = fs.readFileSync(templatePath, 'utf8');
        if (!content || content.trim() === '') {
            console.error('template.md 文件内容为空');
            // 返回默认模板内容
            return res.status(200).send(`# 简历模板\n\n## 基本信息\n\n- 姓名：\n- 年龄：\n- 学历：\n- 专业：\n- 联系方式：\n\n## 教育经历\n\n## 工作经历\n\n## 项目经验\n\n## 技能特长\n\n## 个人评价`);
        }

        // 设置响应头
        res.header('Content-Type', 'text/markdown; charset=utf-8');
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', '0');
        
        // 发送文件内容
        res.send(content);
    } catch (error) {
        console.error('读取template.md文件失败:', error);
        // 返回默认模板内容
        return res.status(200).send(`# 简历模板\n\n## 基本信息\n\n- 姓名：\n- 年龄：\n- 学历：\n- 专业：\n- 联系方式：\n\n## 教育经历\n\n## 工作经历\n\n## 项目经验\n\n## 技能特长\n\n## 个人评价`);
    }
})

// 处理默认头像
app.get('/api/avatar', (req, res) => {
    const defaultAvatar = path.join(__dirname, 'assets/favicon.ico')
    if (!fs.existsSync(defaultAvatar)) {
        return res.status(404).send('Avatar not found');
    }
    
    if (!res.headersSent) {
        res.sendFile(defaultAvatar)
    }
})

// 处理静态资源
app.get('/assets/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'assets', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 所有其他路由返回index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'web/index.html'))
})

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err.stack)
    res.status(500).send('服务器发生错误，请稍后重试')
})

// 导出app实例供Vercel使用
module.exports = app;

// 仅在本地开发时启动服务器
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`网页版应用运行在: http://localhost:${port}`)
        console.log(`请访问: http://localhost:${port}`)
        
        // 检查template.md文件是否存在
        const templatePath = path.join(__dirname, 'template.md');
        if (!fs.existsSync(templatePath)) {
            console.error('警告: template.md 文件不存在');
        } else {
            console.log('template.md 文件已找到');
        }
    })
} 