// 主题管理
class ThemeManager {
    constructor() {
        // 获取主题切换按钮
        this.toggleBtn = document.getElementById('toggleTheme');
        if (!this.toggleBtn) {
            console.error('主题切换按钮未找到');
            return;
        }

        // 初始化主题
        this.currentTheme = localStorage.getItem('theme') || 'light';
        
        // 应用初始主题样式
        this._applyBasicStyles();
    }

    init() {
        // 绑定切换事件
        this.toggleBtn.addEventListener('click', () => {
            this.toggleTheme();
        });

        console.log('主题管理器初始化完成');
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
        this._applyBasicStyles();
        this._updateEditorTheme();
    }

    getTheme() {
        return this.currentTheme;
    }

    _applyBasicStyles() {
        document.body.dataset.theme = this.currentTheme;
        this.toggleBtn.innerHTML = `<i class="fas fa-${this.currentTheme === 'light' ? 'moon' : 'sun'}"></i>`;
    }

    _updateEditorTheme() {
        const editor = window.editorManager && window.editorManager.editor;
        if (editor && editor.updateOptions) {
            try {
                editor.updateOptions({
                    theme: this.currentTheme === 'dark' ? 'vs-dark' : 'vs'
                });
                console.log('编辑器主题更新成功');
            } catch (error) {
                console.error('更新编辑器主题失败:', error);
            }
        }
    }
}

// 导出主题管理器类
window.ThemeManager = ThemeManager; 