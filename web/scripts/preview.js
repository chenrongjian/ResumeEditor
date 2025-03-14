// 预览管理
class PreviewManager {
    constructor() {
        this.previewContainer = document.getElementById('preview');
        this.previewContent = this.previewContainer.querySelector('.preview-content');
        this.scrollTimeout = null;
    }

    async init() {
        try {
            // 配置 Marked
            marked.setOptions({
                breaks: true,
                gfm: true,
                headerIds: true,
                mangle: false
            });

            // 自定义渲染器
            const renderer = new marked.Renderer();

            // 自定义图片渲染
            renderer.image = (href, title, text) => {
                // 处理相对路径
                if (href.startsWith('image/')) {
                    href = '/' + href;
                }
                return `<img src="${href}" alt="${text}"${title ? ` title="${title}"` : ''}>`;
            };

            // 自定义引用块渲染
            renderer.blockquote = (quote) => {
                // 移除段落标签前后的换行符
                quote = quote.replace(/^\s*<p>|<\/p>\s*$/g, '');
                return `<blockquote class="contact-info"><div class="contact-wrapper">${quote}</div></blockquote>`;
            };

            marked.setOptions({ renderer });

            // 等待编辑器初始化完成
            if (!window.editorManager || !window.editorManager.editor) {
                console.log('等待编辑器初始化...');
                await new Promise(resolve => {
                    const checkEditor = setInterval(() => {
                        if (window.editorManager && window.editorManager.editor) {
                            clearInterval(checkEditor);
                            resolve();
                        }
                    }, 100);
                });
            }

            // 初始同步滚动
            this.setupSyncScroll();
            console.log('预览管理器初始化完成');
        } catch (error) {
            console.error('预览管理器初始化失败:', error);
            throw error;
        }
    }

    updatePreview(markdown) {
        try {
            if (!this.previewContent) {
                console.error('预览内容容器未找到');
                return;
            }

            // 保存滚动位置
            const scrollRatio = this.getScrollRatio();
            
            // 更新内容
            const html = marked.parse(markdown || '');
            this.previewContent.innerHTML = html;
            
            // 恢复滚动位置
            this.restoreScroll(scrollRatio);
        } catch (error) {
            console.error('更新预览失败:', error);
        }
    }

    getScrollRatio() {
        if (!this.previewContainer) return 0;
        const { scrollTop, scrollHeight, clientHeight } = this.previewContainer;
        return scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
    }

    restoreScroll(ratio) {
        if (!this.previewContainer) return;
        
        // 确保预览容器可以滚动
        this.previewContainer.style.overflowY = 'auto';
        
        // 计算并设置滚动位置
        const maxScroll = this.previewContainer.scrollHeight - this.previewContainer.clientHeight;
        if (maxScroll > 0) {
            const targetScroll = Math.round(maxScroll * ratio);
            this.previewContainer.scrollTop = targetScroll;
        }
    }

    syncScroll(ratio) {
        if (!this.previewContainer) return;
        
        // 清除之前的定时器
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        
        // 使用定时器延迟执行滚动
        this.scrollTimeout = setTimeout(() => {
            const maxScroll = this.previewContainer.scrollHeight - this.previewContainer.clientHeight;
            if (maxScroll <= 0) return;
            
            const targetScroll = Math.round(maxScroll * ratio);
            console.log('Preview scroll to:', targetScroll); // 调试日志
            this.previewContainer.scrollTop = targetScroll;
        }, 10);
    }

    setupSyncScroll() {
        if (!this.previewContainer || !window.editorManager || !window.editorManager.editor) {
            console.error('无法设置滚动同步：组件未就绪');
            return;
        }

        // 预览区域滚动时同步编辑器
        this.previewContainer.addEventListener('scroll', () => {
            if (this.scrollTimeout) {
                clearTimeout(this.scrollTimeout);
            }

            this.scrollTimeout = setTimeout(() => {
                const maxScroll = this.previewContainer.scrollHeight - this.previewContainer.clientHeight;
                if (maxScroll <= 0) return;

                const ratio = this.previewContainer.scrollTop / maxScroll;
                const editor = window.editorManager.editor;
                const editorScrollHeight = editor.getScrollHeight() - editor.getLayoutInfo().height;
                
                console.log('Preview scroll ratio:', ratio); // 调试日志
                editor.setScrollTop(ratio * editorScrollHeight);
            }, 10);
        }, { passive: true });
    }
}

// 导出预览管理器类
window.PreviewManager = PreviewManager; 