import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './components/App';

// 简单的错误处理函数
function showError(message: string) {
    console.error('[Figma Translator] Error:', message);
    var root = document.getElementById('root');
    if (root) {
        root.innerHTML = '<div class="loading-state" style="color: red;">' +
            '<h2>Error</h2>' +
            '<pre>' + message + '</pre>' +
            '<p>Check console for more details.</p>' +
            '</div>';
    }
}

// 初始化应用
function initApp() {
    try {
        var container = document.getElementById('root');
        if (!container) {
            throw new Error('Root element not found');
        }

        // 清除加载状态
        container.innerHTML = '';
        
        // 创建 React 根节点
        var root = createRoot(container);
        
        // 渲染应用
        root.render(React.createElement(React.StrictMode, null,
            React.createElement(App)
        ));
        
        console.log('[Figma Translator] App initialized');
    } catch (error) {
        showError(error instanceof Error ? error.message : 'Unknown error');
    }
}

// 等待文档加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
} 