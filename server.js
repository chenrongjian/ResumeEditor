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

// 处理template.md路由
app.get('/api/template', (req, res) => {
    const templatePath = path.join(__dirname, 'template.md');
    
    // 检查文件是否存在
    if (!fs.existsSync(templatePath)) {
        console.error('template.md 文件不存在:', templatePath);
        return res.status(404).send('Template file not found');
    }

    try {
        // 读取文件内容
        const content = fs.readFileSync(templatePath, 'utf8');
        if (!content || content.trim() === '') {
            console.error('template.md 文件内容为空');
            return res.status(500).send('Template file is empty');
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
        res.status(500).send('Error reading template file');
    }
})

// 处理默认头像
app.get('/api/avatar', (req, res) => {
    const defaultAvatar = path.join(__dirname, 'assets/favicon.ico')
    if (!res.headersSent) {
        res.sendFile(defaultAvatar)
    }
})

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