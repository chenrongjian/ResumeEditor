// 导出管理
class ExportManager {
    constructor() {
        this.exportBtn = document.getElementById('exportPDF');
        this.loadingOverlay = document.getElementById('loading');
        this.init();
    }

    init() {
        this.exportBtn.addEventListener('click', () => this.exportToPDF());
    }

    async exportToPDF() {
        try {
            this.showLoading('正在生成PDF...');

            const content = window.editorManager.editor.getValue();
            const htmlContent = marked.parse(content);
            
            // 创建临时容器
            const container = document.createElement('div');
            container.innerHTML = htmlContent;
            container.style.padding = '15mm';
            container.style.fontFamily = '"Microsoft YaHei", Arial, sans-serif';
            container.style.fontSize = '9pt';
            container.style.lineHeight = '1.2';
            
            // 添加导出样式
            const style = document.createElement('style');
            style.textContent = `
                h1 { 
                    font-size: 14pt; 
                    margin-bottom: 8pt; 
                    text-align: center !important;
                    width: 100% !important;
                }
                /* 确保联系信息居中 */
                blockquote {
                    text-align: center !important;
                    margin: 8pt auto !important;
                    padding: 0 !important;
                    width: 100% !important;
                    border: none !important;
                }
                blockquote p {
                    text-align: center !important;
                    margin: 0 auto !important;
                    padding: 0 !important;
                    width: 100% !important;
                }
                h2 { 
                    font-size: 11pt; 
                    margin-top: 4pt; 
                    margin-bottom: 3pt; 
                    color: #4870ac; 
                    border-bottom: 1px solid #4870ac; 
                }
                h3 { font-size: 10pt; margin-top: 3pt; margin-bottom: 2pt; }
                p { margin: 1pt 0; }
                ul, ol { margin: 1pt 0; padding-left: 10pt; }
                li { margin: 0.5pt 0; }
                section { margin-bottom: 2pt; }
                img[alt="avatar"] {
                    width: 35mm;
                    height: 35mm;
                    border-radius: 50%;
                    position: absolute;
                    top: 25mm;
                    right: 15mm;
                    border: 2px solid #dae3ea;
                }
            `;
            container.appendChild(style);
            
            // 配置PDF导出选项
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
            
            this.hideLoading();
            this.showNotification('PDF导出成功！');
        } catch (error) {
            console.error('PDF export failed:', error);
            this.hideLoading();
            this.showNotification('PDF导出失败，请重试', true);
        }
    }

    showLoading(message) {
        this.loadingOverlay.querySelector('.loading-text').textContent = message;
        this.loadingOverlay.style.display = 'flex';
    }

    hideLoading() {
        this.loadingOverlay.style.display = 'none';
    }

    showNotification(message, isError = false) {
        const notification = document.createElement('div');
        notification.className = `notification ${isError ? 'error' : 'success'}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// 导出导出管理器类
window.ExportManager = ExportManager; 