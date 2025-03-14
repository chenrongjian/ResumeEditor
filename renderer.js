// 使用 preload 脚本提供的 API
const { readFile, writeFile, fileExists, joinPath, getDirname, showErrorMessage } = window.electronAPI;

// 定义模板内容
const DEFAULT_CONTENT = `# 我的简历

## 个人信息

- 姓名：
- 年龄：
- 邮箱：
- 电话：

## 教育背景

- 学校：
- 专业：
- 学历：
- 时间：

## 工作经验

### 公司名称（xxxx.xx - xxxx.xx）
- 职位：
- 工作内容：
- 主要成就：

## 技能特长

- 编程语言：
- 开发工具：
- 框架：
- 其他技能：

## 项目经验

### 项目名称
- 项目描述：
- 技术栈：
- 负责内容：
- 项目成果：
`

// 获取 template.md 的路径
const templatePath = joinPath(getDirname(), 'template.md')
console.log('Template path:', templatePath)

// 确保 template.md 文件存在
function ensureTemplateFile() {
    try {
        console.log('Checking template file...')
        // 检查文件是否存在
        if (!fileExists(templatePath)) {
            console.error('Template file not found:', templatePath)
            return false
        }
        console.log('Template file exists')
        return true
    } catch (err) {
        console.error('Error handling template file:', err)
        return false
    }
}

// 读取模板内容
function readTemplateContent() {
    try {
        if (!ensureTemplateFile()) {
            console.error('Template file not available')
            return null
        }
        console.log('Reading template file...')
        const content = readFile(templatePath)
        if (!content) {
            console.error('Failed to read template file')
            return null
        }
        console.log('Template file read successfully')
        return content
    } catch (err) {
        console.error('Error reading template file:', err)
        return null
    }
}

// 将编辑器实例设为全局变量
window.editor = null

// 初始化编辑器
window.initEditor = function() {
    try {
        console.log('Initializing editor...')
        const content = readTemplateContent()
        if (!content) {
            console.error('Failed to load template content')
            showErrorMessage('无法加载模板文件，请检查文件是否存在')
            return
        }
        
        // 创建编辑器
        window.editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: content,
            language: 'markdown',
            theme: localStorage.getItem('theme') === 'dark' ? 'vs-dark' : 'vs-light',
            fontSize: 14,
            lineHeight: 20,
            automaticLayout: true,
            wordWrap: 'on',
            wordWrapColumn: 80,
            wrappingIndent: 'indent',
            wrappingStrategy: 'advanced',
            minimap: { 
                enabled: false
            },
            scrollBeyondLastLine: false,
            renderWhitespace: 'boundary',
            rulers: [80],
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            padding: { top: 0, bottom: 0, left: 8, right: 20 }
        })

        console.log('Editor created')

        // 获取预览容器
        const previewContainer = document.getElementById('preview-container')

        // 设置 marked 选项
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            mangle: false
        })

        // 更新预览
        window.updatePreview = function() {
            if (!window.editor) return
            const content = window.editor.getValue()
            const htmlContent = marked.parse(content)
            
            // 记住当前滚动位置
            const scrollTop = previewContainer.scrollTop
            const scrollRatio = scrollTop / (previewContainer.scrollHeight - previewContainer.clientHeight || 1)
            
            // 更新内容
            previewContainer.innerHTML = htmlContent
            
            // 恢复滚动位置
            setTimeout(() => {
                const newScrollTop = scrollRatio * (previewContainer.scrollHeight - previewContainer.clientHeight || 1)
                previewContainer.scrollTop = newScrollTop
            }, 10)
            
            // 自动保存内容到文件
            try {
                writeFile(templatePath, content)
            } catch (err) {
                console.error('Error saving file:', err)
            }
        }

        // 监听编辑器内容变化
        window.editor.onDidChangeModelContent(window.updatePreview)

        // 初始更新预览
        window.updatePreview()
        console.log('Initial preview updated')

        // 添加同步滚动功能
        window.isEditorScrolling = false;
        window.isPreviewScrolling = false;

        // 获取编辑器中的标题和段落位置
        function getEditorHeadingsAndParagraphs() {
            const model = window.editor.getModel();
            const lineCount = model.getLineCount();
            const positions = [];
            
            for (let i = 1; i <= lineCount; i++) {
                const line = model.getLineContent(i);
                // 匹配标题和段落开始
                if (line.match(/^#{1,6}\s/) || line.match(/^\s*$/) && i < lineCount && !model.getLineContent(i + 1).match(/^\s*$/)) {
                    positions.push({
                        line: i,
                        top: window.editor.getTopForLineNumber(i)
                    });
                }
            }
            
            return positions;
        }

        // 获取预览区中的标题和段落位置
        function getPreviewHeadingsAndParagraphs() {
            const headings = previewContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
            const paragraphs = previewContainer.querySelectorAll('p');
            const positions = [];
            
            headings.forEach(heading => {
                positions.push({
                    element: heading,
                    top: heading.offsetTop
                });
            });
            
            paragraphs.forEach(paragraph => {
                positions.push({
                    element: paragraph,
                    top: paragraph.offsetTop
                });
            });
            
            // 按位置排序
            positions.sort((a, b) => a.top - b.top);
            
            return positions;
        }

        // 改进的同步滚动方法
        function syncScroll(fromEditor) {
            if (fromEditor) {
                const editorScrollTop = window.editor.getScrollTop();
                const editorScrollHeight = window.editor.getScrollHeight();
                const editorHeight = window.editor.getLayoutInfo().height;
                
                // 计算滚动比例
                const scrollRatio = editorScrollTop / (editorScrollHeight - editorHeight);
                
                // 如果编辑器滚动到顶部或底部，预览区也应该滚动到对应位置
                if (editorScrollTop <= 0) {
                    previewContainer.scrollTop = 0;
                } else if (editorScrollTop >= editorScrollHeight - editorHeight) {
                    previewContainer.scrollTop = previewContainer.scrollHeight - previewContainer.clientHeight;
                } else {
                    // 在中间位置时使用比例滚动
                    previewContainer.scrollTop = scrollRatio * (previewContainer.scrollHeight - previewContainer.clientHeight);
                }
            } else {
                const previewScrollTop = previewContainer.scrollTop;
                const previewScrollHeight = previewContainer.scrollHeight;
                const previewHeight = previewContainer.clientHeight;
                
                // 计算滚动比例
                const scrollRatio = previewScrollTop / (previewScrollHeight - previewHeight);
                
                // 如果预览区滚动到顶部或底部，编辑器也应该滚动到对应位置
                if (previewScrollTop <= 0) {
                    window.editor.setScrollTop(0);
                } else if (previewScrollTop >= previewScrollHeight - previewHeight) {
                    window.editor.setScrollTop(window.editor.getScrollHeight() - window.editor.getLayoutInfo().height);
                } else {
                    // 在中间位置时使用比例滚动
                    window.editor.setScrollTop(scrollRatio * (window.editor.getScrollHeight() - window.editor.getLayoutInfo().height));
                }
            }
        }

        // 监听编辑器滚动事件
        window.editor.onDidScrollChange((e) => {
            if (window.isPreviewScrolling) return; // 避免循环触发
            
            window.isEditorScrolling = true;
            syncScroll(true);
            
            setTimeout(() => {
                window.isEditorScrolling = false;
            }, 100);
        });

        // 监听预览区滚动事件
        previewContainer.addEventListener('scroll', () => {
            if (window.isEditorScrolling) return; // 避免循环触发
            
            window.isPreviewScrolling = true;
            syncScroll(false);
            
            setTimeout(() => {
                window.isPreviewScrolling = false;
            }, 100);
        });

        // 隐藏加载提示
        document.getElementById('loading').style.display = 'none'

        return true
    } catch (error) {
        console.error('Editor initialization failed:', error)
        throw error
    }
}

// PDF导出功能
window.exportPDF = async function() {
    if (!window.editor) return
    console.log('Starting PDF export...')
    
    try {
        // 显示导出状态
        const loadingEl = document.getElementById('loading');
        loadingEl.textContent = '正在导出PDF，请稍候...';
        loadingEl.style.display = 'block';
        
        // 获取预览内容
        const previewContainer = document.getElementById('preview-container')
        if (!previewContainer) {
            throw new Error('预览区域不存在')
        }

        // 等待一下，确保预览内容已经渲染完成
        await new Promise(resolve => setTimeout(resolve, 100))

        // 请求主进程导出PDF
        window.electronAPI.requestPDFExport()
    } catch (err) {
        console.error('PDF export error:', err)
        showErrorMessage('PDF导出失败: ' + err.message)
        // 隐藏导出状态
        document.getElementById('loading').style.display = 'none';
    }
}

// 监听PDF保存成功
window.electronAPI.onPDFSaved((pdfPath) => {
    console.log('PDF saved to:', pdfPath)
    showErrorMessage(`PDF导出成功！文件保存在: ${pdfPath}`)
    // 隐藏导出状态
    document.getElementById('loading').style.display = 'none';
})

// 监听PDF导出错误
window.electronAPI.onPDFError((error) => {
    console.error('PDF export failed:', error)
    showErrorMessage('PDF导出失败: ' + error)
    // 隐藏导出状态
    document.getElementById('loading').style.display = 'none';
})

// 文件保存功能
window.saveFile = function() {
    if (!window.editor) return
    try {
        writeFile(templatePath, window.editor.getValue())
        alert('简历保存成功!')
    } catch (err) {
        showErrorMessage('保存失败: ' + err.message)
    }
}

// 监听来自主进程的导出PDF命令
window.electronAPI.onExportPDF(() => {
    console.log('Received export-pdf command')
    window.exportPDF()
})

// 监听来自主进程的保存命令
window.electronAPI.onSaveDocument(() => {
    console.log('Received save-document command')
    window.saveFile()
})

// 监听来自主进程的主题切换命令
window.electronAPI.onToggleTheme(() => {
    console.log('Received toggle-theme command')
    if (window.themeManager) {
        window.themeManager.toggleTheme()
        // 主题切换已在 theme-switcher.js 中完全处理
    }
})
