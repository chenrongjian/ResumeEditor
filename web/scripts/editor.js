// 编辑器管理
class EditorManager {
    constructor() {
        // 立即清除缓存
        console.log('清除编辑器缓存...');
        localStorage.clear(); // 清除所有localStorage数据
        
        this.editor = null;
        this.container = document.getElementById('editor');
        this.content = '';
        this.saveNotification = document.getElementById('saveNotification');
        this.saveTimeout = null;
        this.scrollTimeout = null;
        this.templateLoaded = false;
    }

    async init() {
        if (!this.container) {
            console.error('编辑器容器未找到');
            return Promise.reject('编辑器容器未找到');
        }

        try {
            // 确保 monaco 已加载
            if (typeof monaco === 'undefined' || !window.monaco) {
                console.error('Monaco Editor 未加载');
                return Promise.reject('Monaco Editor 未加载');
            }

            // 加载模板内容
            try {
                await this.loadTemplateContent();
                if (!this.templateLoaded) {
                    throw new Error('模板加载失败');
                }
            } catch (error) {
                console.error('无法加载模板:', error);
                return Promise.reject('无法加载模板');
            }

            // 获取当前主题
            const currentTheme = window.themeManager ? window.themeManager.getTheme() : 'light';
            
            // 创建编辑器实例
            this.editor = monaco.editor.create(this.container, {
                value: this.content,
                language: 'markdown',
                theme: currentTheme === 'dark' ? 'vs-dark' : 'vs',
                fontSize: 14,
                lineHeight: 21,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                wrappingIndent: 'same',
                wordWrapColumn: 120,
                wrappingStrategy: 'advanced',
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true,
                lineNumbers: 'on',
                glyphMargin: false,
                folding: true,
                renderLineHighlight: 'all',
                renderWhitespace: 'none',
                readOnly: false,
                domReadOnly: false,
                ariaReadOnly: false,
                automaticLayout: true,
                scrollbar: {
                    vertical: 'visible',
                    horizontal: 'hidden',
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 0
                }
            });

            // 监听内容变化
            this.editor.onDidChangeModelContent(() => {
                const content = this.editor.getValue();
                if (content.trim() !== '') {
                    localStorage.setItem('editorContent', content);
                }
                if (window.previewManager) {
                    window.previewManager.updatePreview(content);
                }
                this.debounceSave();
            });

            // 监听编辑器滚动
            this.editor.onDidScrollChange(e => {
                if (!window.previewManager || !e.scrollTop) return;
                
                if (this.scrollTimeout) {
                    clearTimeout(this.scrollTimeout);
                }
                
                this.scrollTimeout = setTimeout(() => {
                    const scrollHeight = this.editor.getScrollHeight() - this.editor.getLayoutInfo().height;
                    if (scrollHeight <= 0) return;
                    
                    const ratio = e.scrollTop / scrollHeight;
                    window.previewManager.syncScroll(ratio);
                }, 10);
            });

            // 添加快捷键
            this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                this.saveContent();
            });

            // 设置自动保存
            this.setupAutoSave();

            // 创建编辑器实例后，添加窗口大小变化监听
            window.addEventListener('resize', () => {
                if (this.editor) {
                    this.editor.layout();
                    console.log('编辑器大小已调整');
                }
            });

            // 额外检查以确保编辑器可编辑
            this.ensureEditorEditable();

            // 确保编辑器内容区域宽度正确
            setTimeout(() => {
                this.fixEditorContentWidth();
            }, 500);

            console.log('编辑器初始化完成');
            return Promise.resolve();
        } catch (error) {
            console.error('编辑器初始化失败:', error);
            return Promise.reject(error);
        }
    }

    getContent() {
        return this.editor ? this.editor.getValue() : '';
    }

    debounceSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.saveContent();
        }, 1000);
    }

    saveContent() {
        if (!this.editor) return;
        
        try {
            const content = this.editor.getValue();
            localStorage.setItem('editorContent', content);
            this.showSaveNotification();
        } catch (error) {
            console.error('保存失败:', error);
        }
    }

    showSaveNotification() {
        if (!this.saveNotification) return;
        
        this.saveNotification.style.display = 'flex';
        this.saveNotification.classList.add('show');
        setTimeout(() => {
            this.saveNotification.classList.remove('show');
            setTimeout(() => {
                this.saveNotification.style.display = 'none';
            }, 300);
        }, 2000);
    }

    setupAutoSave() {
        // 每30秒自动保存
        setInterval(() => this.saveContent(), 30000);

        // 页面关闭前保存
        window.addEventListener('beforeunload', () => {
            this.saveContent();
        });
    }

    getDefaultContent() {
        return `# 我的简历\n\n## 个人信息\n\n- 姓名：\n- 年龄：\n- 邮箱：\n- 电话：\n\n## 教育背景\n\n- 学校：\n- 专业：\n- 学历：\n- 时间：\n\n## 工作经验\n\n### 公司名称（xxxx.xx - xxxx.xx）\n- 职位：\n- 工作内容：\n- 主要成就：\n\n## 技能特长\n\n- 编程语言：\n- 开发工具：\n- 框架：\n- 其他技能：\n\n## 项目经验\n\n### 项目名称\n- 项目描述：\n- 技术栈：\n- 负责内容：\n- 项目成果：`;
    }

    // 确保编辑器是可编辑的
    ensureEditorEditable() {
        if (!this.editor) return;
        
        try {
            // 检查编辑器是否被设置为只读
            const isReadOnly = this.editor.getOption(monaco.editor.EditorOption.readOnly);
            if (isReadOnly) {
                console.log('检测到编辑器为只读模式，正在修复...');
                this.editor.updateOptions({ readOnly: false });
            }
            
            // 检查DOM元素
            const editorElement = this.container;
            if (editorElement) {
                // 确保容器及其父元素可见且可交互
                editorElement.style.visibility = 'visible';
                editorElement.style.display = 'block';
                editorElement.style.pointerEvents = 'auto';
                
                // 查找并修复monaco内部元素的pointer-events
                setTimeout(() => {
                    const textareas = editorElement.querySelectorAll('textarea');
                    const contentEditable = editorElement.querySelectorAll('[contenteditable=true]');
                    
                    // 确保所有可编辑元素都能接收事件
                    [...textareas, ...contentEditable].forEach(el => {
                        el.style.pointerEvents = 'auto';
                    });
                    
                    // 修复滚动区域
                    const scrollElements = editorElement.querySelectorAll('.monaco-scrollable-element');
                    scrollElements.forEach(el => {
                        el.style.pointerEvents = 'auto';
                    });
                    
                    console.log('编辑器DOM元素已修复');
                }, 500);
            }
        } catch (error) {
            console.error('确保编辑器可编辑时出错:', error);
        }
    }

    // 加载模板内容
    async loadTemplateContent() {
        try {
            console.log('开始加载模板文件...');
            // 强制清除缓存
            localStorage.removeItem('editorContent');
            
            const timestamp = new Date().getTime(); // 添加时间戳防止缓存
            const response = await fetch(`/template.md?t=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`加载模板失败: ${response.status} ${response.statusText}`);
            }
            
            this.content = await response.text();
            
            if (!this.content || this.content.trim() === '') {
                throw new Error('模板内容为空');
            }
            
            this.templateLoaded = true;
            console.log('模板加载成功，内容长度:', this.content.length);
            return this.content;
        } catch (error) {
            console.error('加载模板文件失败:', error);
            this.templateLoaded = false;
            throw error;
        }
    }

    // 修复编辑器内容区域宽度
    fixEditorContentWidth() {
        try {
            if (!this.editor) return;
            
            // 重新布局编辑器
            this.editor.layout();
            
            // 禁用水平滚动条
            const editorElement = this.container;
            if (editorElement) {
                const horizontalScrollbar = editorElement.querySelector('.horizontal-scrollbar');
                if (horizontalScrollbar) {
                    horizontalScrollbar.style.display = 'none';
                }
            }
            
            console.log('编辑器内容区域宽度已修复');
        } catch (error) {
            console.error('修复编辑器内容区域宽度时出错:', error);
        }
    }
}

// 导出EditorManager类
window.EditorManager = EditorManager;

// 确保在页面加载前清除缓存
(function() {
    console.log('页面加载，清除所有缓存...');
    localStorage.clear(); // 清除所有localStorage数据
})(); 