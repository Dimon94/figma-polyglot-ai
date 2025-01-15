import React, { useState, useEffect } from 'react';
import { TranslationProgress } from './translation/TranslationProgress';
import { TranslationHistoryView } from './translation/TranslationHistory';
import './App.css';

interface TranslationProgress {
  total: number;
  completed: number;
  failed: number;
  status: 'idle' | 'translating' | 'completed' | 'error';
  errorMessage?: string;
}

export const App: React.FC = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [progress, setProgress] = useState<TranslationProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    status: 'idle'
  });

  useEffect(() => {
    // 监听来自插件的消息
    const handleMessage = (event: MessageEvent) => {
      const { type, message } = event.data.pluginMessage || {};
      
      if (type === 'translation-progress') {
        // 从消息中提取总数
        const match = message?.match(/(\d+)\/(\d+)/);
        const current = match ? parseInt(match[1]) : 0;
        const total = match ? parseInt(match[2]) : 1;
        
        setProgress({
          total: total,
          completed: current,
          failed: 0,
          status: 'translating',
          errorMessage: message
        });
      } else if (type === 'translation-complete') {
        // 延迟重置状态，让用户能看到完成状态
        setTimeout(() => {
          setProgress({
            total: 0,
            completed: 0,
            failed: 0,
            status: 'idle'
          });
        }, 1500);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 渲染主页面内容
  const renderMainContent = () => (
    <>
      <div className="header">
        <h1>Figma 翻译助手</h1>
        <button 
          className="history-button"
          onClick={() => setShowHistory(true)}
        >
          查看历史记录
        </button>
      </div>

      <div className="main-content">
        {(progress.status === 'translating' || progress.status === 'completed') && (
          <TranslationProgress
            current={progress.completed}
            total={progress.total}
            status={progress.status}
            errorMessage={progress.errorMessage}
          />
        )}

        {progress.status === 'idle' && (
          <div className="empty-state">
            <div className="empty-state-icon">📝</div>
            <p>
              选择需要翻译的文本图层或包含文本的组件（如 Frame），然后点击右键菜单中的"翻译"选项开始翻译。
              <br /><br />
              支持批量选择多个文本图层同时翻译。
            </p>
          </div>
        )}
      </div>
    </>
  );

  // 渲染历史记录页面
  const renderHistoryContent = () => (
    <TranslationHistoryView onClose={() => setShowHistory(false)} />
  );

  return (
    <div className="app">
      {showHistory ? renderHistoryContent() : renderMainContent()}
    </div>
  );
}; 