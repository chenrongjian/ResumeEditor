const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

// 获取资源路径
function getResourcePath() {
  // 首先尝试从命令行参数获取应用路径
  const appArg = process.argv.find(arg => arg.startsWith('--app-path='));
  if (appArg) {
    const appPath = appArg.split('=')[1];
    console.log('Using app path:', appPath);
    return appPath;
  }
  
  // 如果没有命令行参数，使用当前目录
  console.log('Using current directory:', __dirname);
  return path.resolve(__dirname, '..');
}

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  readFile: (filePath) => {
    try {
      console.log('Reading file:', filePath);
      if (!fs.existsSync(filePath)) {
        console.log('File not found:', filePath);
        return null;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      console.log('File read successfully:', filePath);
      return content;
    } catch (err) {
      console.error('Error reading file:', filePath, err);
      return null;
    }
  },
  writeFile: (filePath, content) => {
    try {
      console.log('Writing file:', filePath);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('File written successfully:', filePath);
      return true;
    } catch (err) {
      console.error('Error writing file:', filePath, err);
      return false;
    }
  },
  fileExists: (filePath) => {
    try {
      console.log('Checking file existence:', filePath);
      const exists = fs.existsSync(filePath);
      console.log('File exists:', exists);
      return exists;
    } catch (err) {
      console.error('Error checking file existence:', filePath, err);
      return false;
    }
  },
  // 路径操作
  joinPath: (...args) => {
    const result = path.join(...args);
    console.log('Joining paths:', args, 'Result:', result);
    return result;
  },
  getDirname: () => {
    const resourcePath = getResourcePath();
    console.log('Getting dirname:', resourcePath);
    return resourcePath;
  },
  // IPC通信
  onSaveDocument: (callback) => {
    ipcRenderer.on('save-document', callback);
  },
  onExportPDF: (callback) => {
    ipcRenderer.on('export-pdf', callback);
  },
  // 主题切换相关
  onToggleTheme: (callback) => {
    ipcRenderer.on('toggle-theme', callback);
  },
  // PDF导出相关
  requestPDFExport: () => {
    ipcRenderer.send('print-to-pdf');
  },
  onPDFSaved: (callback) => {
    ipcRenderer.on('pdf-saved', (event, path) => callback(path));
  },
  onPDFError: (callback) => {
    ipcRenderer.on('pdf-error', (event, error) => callback(error));
  },
  // 错误处理
  showErrorMessage: (message) => {
    console.error(message);
    alert(message);
  }
});