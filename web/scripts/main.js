// 应用初始化
async function initializeApp() {
    try {
        // 显示加载提示
        const loading = document.getElementById('loading');
        loading.style.display = 'flex';
        loading.querySelector('.loading-text').textContent = '正在初始化编辑器...';

        // 初始化编辑器
        await window.editorManager.init();
        console.log('编辑器初始化完成');

        // 初始化预览
        await window.previewManager.init();
        console.log('预览初始化完成');

        // 更新预览内容
        const content = window.editorManager.editor.getValue();
        window.previewManager.updatePreview(content);
        console.log('初始预览内容已更新');

        // 隐藏加载提示
        loading.style.display = 'none';
        
        // 延迟检查编辑器状态，确保可编辑
        setTimeout(() => {
            if (window.editorManager && window.editorManager.editor) {
                console.log('延迟检查编辑器状态...');
                window.editorManager.ensureEditorEditable();
                
                // 尝试触发焦点事件，确保编辑器可交互
                window.editorManager.editor.focus();
            }
        }, 1000);

    } catch (error) {
        console.error('应用初始化失败:', error);
        const loading = document.getElementById('loading');
        loading.querySelector('.loading-text').textContent = '初始化失败，请刷新页面重试';
        loading.style.display = 'flex';
    }
}

// 立即执行初始化
initializeApp(); 