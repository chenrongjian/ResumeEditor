// 主题切换功能
let isDarkMode = localStorage.getItem('theme') === 'dark';

// 初始化主题
function initTheme() {
  if (isDarkMode) {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }
}

// 在 DOM 加载完成后初始化主题
document.addEventListener('DOMContentLoaded', initTheme);

// 切换主题
window.toggleTheme = function() {
  isDarkMode = !isDarkMode;
  // 保存主题设置到本地存储
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  
  // 应用主题
  if (isDarkMode) {
    document.body.classList.add('dark-theme');
    if (window.editor) {
      monaco.editor.setTheme('vs-dark');
    }
  } else {
    document.body.classList.remove('dark-theme');
    if (window.editor) {
      monaco.editor.setTheme('vs-light');
    }
  }
}

// 导出函数
window.themeManager = {
  toggleTheme,
  isDarkMode: () => isDarkMode,
  initTheme
};
