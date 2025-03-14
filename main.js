const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const http = require('http')

// 开发模式标志
const isDev = process.argv.includes('--dev-mode')

// 获取资源路径
function getAssetPath(...paths) {
  // 在开发模式下使用当前目录，在生产模式下使用应用目录
  const basePath = isDev ? __dirname : app.getAppPath();
  const fullPath = path.join(basePath, ...paths);
  console.log('Asset path:', fullPath);
  return fullPath;
}

// 监视文件变化
function watchFiles(win) {
  if (!isDev) return

  // 监视主要文件
  const filesToWatch = ['index.html', 'renderer.js', 'lapis-cv.css']
  filesToWatch.forEach(file => {
    fs.watch(path.join(__dirname, file), (eventType) => {
      if (eventType === 'change') {
        win.webContents.reload()
      }
    })
  })
}

// 确保应用目录存在
function ensureAppDirectory() {
  const appDir = isDev ? __dirname : app.getAppPath();
  console.log('App directory:', appDir);
  return appDir;
}

// 下载文件的函数
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    // 检查文件是否已存在
    if (fs.existsSync(dest)) {
      console.log(`File already exists: ${dest}`);
      return resolve(dest);
    }

    // 创建目录（如果不存在）
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 选择合适的协议
    const protocol = url.startsWith('https') ? https : http;
    
    const file = fs.createWriteStream(dest);
    const request = protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download file: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
    });

    file.on('finish', () => {
      file.close();
      console.log(`File downloaded: ${dest}`);
      resolve(dest);
    });

    request.on('error', (err) => {
      fs.unlink(dest, () => {}); // 删除部分下载的文件
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(dest, () => {}); // 删除部分下载的文件
      reject(err);
    });

    request.end();
  });
}

function createWindow() {
  // 确保应用目录存在
  const appDir = ensureAppDirectory()
  
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Markdown简历编辑器',
    icon: path.join(__dirname, 'assets', 'favicon.ico'),
    titleBarStyle: 'default',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [
        `--app-path=${app.getAppPath()}`,
        `--resources-path=${getAssetPath()}`
      ]
    }
  })

  // 阻止页面标题更改窗口标题
  win.on('page-title-updated', (event) => {
    event.preventDefault()
  })

  // 创建菜单模板
  const template = [
    {
      label: '文件',
      submenu: [
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            win.webContents.send('save-document')
          }
        },
        {
          label: '导出PDF',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            win.webContents.send('export-pdf')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          role: 'quit'
        }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '刷新' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' },
        { type: 'separator' },
        {
          label: '切换主题',
          click: () => {
            win.webContents.send('toggle-theme')
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  win.loadFile('index.html')
  
  // 处理PDF导出
  ipcMain.on('print-to-pdf', async (event) => {
    try {
      // 获取预览区域的HTML内容和头像URL
      const previewData = await win.webContents.executeJavaScript(`
        (function() {
          const previewElement = document.querySelector('.cv-preview');
          const clonedPreview = previewElement.cloneNode(true);
          
          // 获取头像URL
          let avatarUrl = '';
          const avatar = document.querySelector('img[alt="avatar"]');
          if (avatar) {
            avatarUrl = avatar.src;
            console.log('Found avatar URL:', avatarUrl);
            
            // 从克隆的预览中移除头像
            const clonedAvatar = clonedPreview.querySelector('img[alt="avatar"]');
            if (clonedAvatar && clonedAvatar.parentElement) {
              clonedAvatar.parentElement.remove();
            }
          } else {
            console.log('Avatar not found');
          }
          
          // 查找姓名标题的位置
          let nameTitleTop = 60; // 默认位置（单位：mm）
          const nameTitle = clonedPreview.querySelector('h1');
          if (nameTitle) {
            // 获取标题的位置（相对于预览区域）
            const previewRect = previewElement.getBoundingClientRect();
            const titleRect = nameTitle.getBoundingClientRect();
            // 转换为毫米（假设1mm约等于3.78px）
            const pixelsPerMm = 3.78;
            nameTitleTop = (titleRect.top - previewRect.top) / pixelsPerMm;
            console.log('Name title top position (mm):', nameTitleTop);
          }
          
          // 查找基本信息标题的位置
          let basicInfoTitleTop = 120; // 默认位置（单位：mm）
          const basicInfoTitle = Array.from(clonedPreview.querySelectorAll('h2')).find(h2 => 
            h2.textContent.includes('基本信息'));
          if (basicInfoTitle) {
            // 获取标题的位置（相对于预览区域）
            const previewRect = previewElement.getBoundingClientRect();
            const titleRect = basicInfoTitle.getBoundingClientRect();
            // 转换为毫米（假设1mm约等于3.78px）
            const pixelsPerMm = 3.78;
            basicInfoTitleTop = (titleRect.top - previewRect.top) / pixelsPerMm;
            console.log('Basic info title top position (mm):', basicInfoTitleTop);
          }
          
          // 查找专业技能标题的位置
          let skillsTitleTop = 240; // 默认位置（单位：mm）
          const skillsTitle = Array.from(clonedPreview.querySelectorAll('h2')).find(h2 => 
            h2.textContent.includes('专业技能'));
          if (skillsTitle) {
            // 获取标题的位置（相对于预览区域）
            const previewRect = previewElement.getBoundingClientRect();
            const titleRect = skillsTitle.getBoundingClientRect();
            // 转换为毫米（假设1mm约等于3.78px）
            const pixelsPerMm = 3.78;
            skillsTitleTop = (titleRect.top - previewRect.top) / pixelsPerMm;
            console.log('Skills title top position (mm):', skillsTitleTop);
          }
          
          // 确保标题居中
          if (nameTitle) {
            nameTitle.style.textAlign = 'center';
            nameTitle.style.paddingRight = '0';
            nameTitle.style.width = '100%';
          }
          
          // 确保联系信息居中
          const firstParagraph = clonedPreview.querySelector('p:first-of-type');
          if (firstParagraph && !firstParagraph.querySelector('img')) {
            firstParagraph.style.textAlign = 'center';
            firstParagraph.style.width = '100%';
          }
          
          return {
            html: clonedPreview.innerHTML,
            avatarUrl: avatarUrl,
            nameTitleTop: nameTitleTop,
            basicInfoTitleTop: basicInfoTitleTop,
            skillsTitleTop: skillsTitleTop
          };
        })()
      `);

      console.log('Avatar URL:', previewData.avatarUrl);
      console.log('Name title top position (mm):', previewData.nameTitleTop);
      console.log('Basic info title top position (mm):', previewData.basicInfoTitleTop);
      console.log('Skills title top position (mm):', previewData.skillsTitleTop);

      // 处理头像URL
      let avatarUrl = previewData.avatarUrl || 'https://avatars.githubusercontent.com/u/583231?v=4';
      
      // 如果是本地文件路径，转换为绝对路径
      if (avatarUrl.startsWith('./') || avatarUrl.startsWith('../') || (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('file://'))) {
        // 移除开头的 ./ 或 ../
        const normalizedPath = avatarUrl.replace(/^\.\/|^\.\.\//, '');
        // 如果路径已经是绝对路径，直接使用
        if (path.isAbsolute(normalizedPath)) {
          avatarUrl = `file://${normalizedPath.replace(/\\/g, '/')}`;
        } else {
          const absolutePath = path.resolve(__dirname, normalizedPath);
          avatarUrl = `file://${absolutePath.replace(/\\/g, '/')}`;
        }
        console.log('Converted avatar URL:', avatarUrl);
      }

      // 计算头像位置（相对于基本信息标题）
      const avatarTop = (previewData.basicInfoTitleTop || 120) + 30;

      // 构建完整的HTML
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            /* 基础样式 */
            :root {
              --text-color: #353a42;
              --primary-color: #4870ac;
              --link-color: #4c91da;
              --border-color: #dae3ea;
              --bg-color: #ffffff;
              --avatar-width: 35mm;
            }

            @page {
              size: A4;
              margin: 0;
            }

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              width: 210mm;
              height: 297mm;
              background: var(--bg-color);
              position: relative;
              overflow: hidden;
              margin: 0 auto; /* 居中显示 */
            }

            /* 主容器 */
            .cv-preview {
              width: 210mm;
              height: 297mm;
              padding: 15mm; /* 减少内边距，留出更多空间给内容 */
              background: var(--bg-color);
              font-size: 10pt;
              line-height: 1.3; /* 减少行高，使内容更紧凑 */
              color: var(--text-color);
              position: relative;
              overflow: hidden; /* 确保内容不会溢出 */
              page-break-after: always; /* 确保每个简历占据一整页 */
            }

            /* 确保内容不会过长 */
            .cv-preview > * {
              max-width: 100%;
            }

            /* 调整段落间距，确保内容紧凑 */
            p {
              margin: 2pt 0; /* 减少段落间距 */
            }

            /* 移除头像的原始位置 */
            img[alt="avatar"] {
              display: none;
            }

            /* 标题样式 */
            h1 {
              font-size: 16pt;
              text-align: center !important; /* 强制居中 */
              margin-bottom: 10pt; /* 减少底部间距 */
              padding-right: 0 !important; /* 移除右侧内边距，确保居中 */
              position: relative;
              z-index: 1;
              width: 100% !important; /* 确保宽度为100% */
            }

            h2 {
              font-size: 13pt; /* 稍微减小标题字体 */
              color: var(--primary-color);
              border-bottom: 1px solid var(--primary-color);
              margin-top: 5pt;
              margin-bottom: 4pt; /* 减少底部间距 */
              padding-bottom: 2pt;
              position: relative; /* 设置相对定位 */
            }

            /* 列表样式 */
            ul {
              list-style-type: disc;
              margin: 2pt 0; /* 减少列表外边距 */
              padding-left: 12pt; /* 减少列表缩进 */
            }

            li {
              margin: 1pt 0; /* 减少列表项间距 */
              padding-right: 0; /* 移除右侧内边距 */
            }

            /* 链接样式 */
            a {
              color: var(--link-color);
              text-decoration: none;
              font-weight: normal; /* 恢复正常字重 */
            }

            /* 移除所有装饰 */
            hr {
              display: none;
            }

            /* 调整各部分之间的间距 */
            section, div {
              margin-bottom: 3pt; /* 减少部分间距 */
            }

            /* 自定义头像样式 */
            .avatar-container {
              position: absolute;
              top: ${avatarTop}mm;
              right: 15mm;
              width: 40mm; /* 头像尺寸 */
              height: 40mm;
              z-index: 100;
              background-image: url('${avatarUrl}');
              background-size: cover;
              background-position: center;
              border-radius: 50%;
              border: 2px solid var(--border-color);
              box-shadow: 0 0 0 2mm var(--bg-color);
            }

            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .cv-preview {
                transform-origin: top left;
                transform: scale(0.98); /* 稍微缩小，确保内容完全适应页面 */
                page-break-inside: avoid; /* 避免内容在页面内部断开 */
                position: relative; /* 确保相对定位 */
              }
              /* 确保链接在打印时清晰可见 */
              a {
                font-weight: normal;
                text-decoration: none !important;
              }
              /* 确保标题居中 */
              h1 {
                text-align: center !important;
                padding-right: 0 !important;
                width: 100% !important;
                margin-left: auto !important;
                margin-right: auto !important;
              }
              /* 确保联系信息居中 */
              .cv-preview > p:first-of-type:not(:has(img)) {
                text-align: center !important;
                width: 100% !important;
                margin-left: auto !important;
                margin-right: auto !important;
              }
              /* 确保头像位置正确 */
              .avatar-container {
                position: absolute !important;
                top: ${avatarTop}mm !important;
                right: 15mm !important;
                width: 40mm !important;
                height: 40mm !important;
                z-index: 100 !important;
                background-image: url('${avatarUrl}') !important;
                background-size: cover !important;
                background-position: center !important;
                border-radius: 50% !important;
                border: 2px solid var(--border-color) !important;
                box-shadow: 0 0 0 2mm var(--bg-color) !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="cv-preview">
            ${previewData.html}
            <div class="avatar-container"></div>
          </div>
        </body>
        </html>
      `;

      // 将HTML写入临时文件
      const tempFile = path.join(app.getPath('temp'), 'resume-print.html');
      fs.writeFileSync(tempFile, html);
      console.log('Temp file created:', tempFile);

      // 创建临时窗口
      const tempWin = new BrowserWindow({
        width: 794, // A4 宽度（像素）
        height: 1123, // A4 高度（像素）
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      // 加载临时文件
      await tempWin.loadFile(tempFile);
      // 增加等待时间，确保内容完全渲染
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Temp file loaded');

      // 导出PDF
      const data = await tempWin.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0
        },
        scale: 0.98, // 稍微缩小，确保内容完全适应页面
        preferCSSPageSize: true,
        printSelectionOnly: false,
        landscape: false, // 确保使用纵向模式
        displayHeaderFooter: false, // 不显示页眉页脚
        headerTemplate: '',
        footerTemplate: ''
      });

      // 生成带时间戳的文件名
      const now = new Date();
      const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
      const pdfPath = path.join(app.getPath('downloads'), `resume-${timestamp}.pdf`);
      
      // 写入PDF文件
      fs.writeFileSync(pdfPath, data);

      // 清理临时文件
      fs.unlinkSync(tempFile);

      // 关闭临时窗口
      tempWin.close();

      // 发送成功消息
      win.webContents.send('pdf-saved', pdfPath);
    } catch (error) {
      console.error('PDF generation failed:', error);
      win.webContents.send('pdf-error', error.message);
    }
  })

  // 在开发模式下监视文件变化
  watchFiles(win)
}

// 当 Electron 完成初始化时创建窗口
app.whenReady().then(() => {
  // 设置应用名称
  app.setName('Markdown简历编辑器')
  
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
