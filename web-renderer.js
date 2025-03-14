// 从服务器获取模板内容
async function getTemplateContent() {
    try {
        const response = await fetch('template.md');
        if (!response.ok) {
            throw new Error('Failed to load template');
        }
        return await response.text();
    } catch (error) {
        console.error('Error loading template:', error);
        // 如果加载失败，返回默认内容
        return `# 我的简历

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
- 项目成果：`;
    }
}

// 初始化编辑器
window.initEditor = async function() {
    try {
        console.log('Initializing editor...')
        const templateContent = await getTemplateContent();
        const savedContent = localStorage.getItem('resume-content') || templateContent;
        
        // 创建编辑器
        window.editor = monaco.editor.create(document.getElementById('editor-container'), {
            value: savedContent,
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
        function updatePreview() {
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
            
            // 保存内容到 localStorage
            localStorage.setItem('resume-content', content)
        }

        // 监听编辑器内容变化
        window.editor.onDidChangeModelContent(updatePreview)

        // 初始更新预览
        updatePreview()
        console.log('Initial preview updated')

        // 添加同步滚动功能
        let isEditorScrolling = false
        let isPreviewScrolling = false

        // 编辑器滚动事件
        window.editor.onDidScrollChange(() => {
            if (!isPreviewScrolling) {
                isEditorScrolling = true
                const editorInfo = window.editor.getScrollTop() / window.editor.getScrollHeight()
                previewContainer.scrollTop = editorInfo * previewContainer.scrollHeight
                setTimeout(() => isEditorScrolling = false, 50)
            }
        })

        // 预览区滚动事件
        previewContainer.addEventListener('scroll', () => {
            if (!isEditorScrolling) {
                isPreviewScrolling = true
                const previewInfo = previewContainer.scrollTop / previewContainer.scrollHeight
                window.editor.setScrollTop(previewInfo * window.editor.getScrollHeight())
                setTimeout(() => isPreviewScrolling = false, 50)
            }
        })

        // 导出PDF功能
        window.exportPDF = async function() {
            try {
                // 显示加载提示
                document.getElementById('loading').textContent = '正在生成PDF...';
                document.getElementById('loading').style.display = 'block';

                const content = window.editor.getValue();
                const htmlContent = marked.parse(content);
                
                // 创建临时容器
                const container = document.createElement('div');
                container.innerHTML = htmlContent;
                container.style.padding = '15mm';
                container.style.fontFamily = '"Microsoft YaHei", Arial, sans-serif';
                container.style.fontSize = '9pt';
                container.style.lineHeight = '1.2';
                
                // 添加额外的样式
                const style = document.createElement('style');
                style.textContent = `
                    h1 { font-size: 14pt; margin-bottom: 8pt; }
                    h2 { font-size: 11pt; margin-top: 4pt; margin-bottom: 3pt; }
                    h3 { font-size: 10pt; margin-top: 3pt; margin-bottom: 2pt; }
                    p { margin: 1pt 0; }
                    ul, ol { margin: 1pt 0; padding-left: 10pt; }
                    li { margin: 0.5pt 0; }
                    .cv-preview > section { margin-bottom: 2pt; }
                `;
                container.appendChild(style);

                // 设置html2pdf选项
                const opt = {
                    margin: 0,
                    filename: '我的简历.pdf',
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { 
                        scale: 2,
                        useCORS: true,
                        letterRendering: true
                    },
                    jsPDF: { 
                        unit: 'mm', 
                        format: 'a4', 
                        orientation: 'portrait',
                        compress: true
                    },
                    pagebreak: { mode: 'avoid-all' }
                };

                // 生成PDF
                await html2pdf().set(opt).from(container).save();
                
                // 隐藏加载提示
                document.getElementById('loading').style.display = 'none';
            } catch (error) {
                console.error('PDF export failed:', error);
                document.getElementById('loading').textContent = '导出PDF失败，请重试';
                setTimeout(() => {
                    document.getElementById('loading').style.display = 'none';
                }, 2000);
            }
        }

        // 添加快捷键支持
        window.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + P 导出PDF
            if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
                e.preventDefault()
                window.exportPDF()
            }
        })

        return true
    } catch (error) {
        console.error('Editor initialization failed:', error)
        throw error
    }
} 