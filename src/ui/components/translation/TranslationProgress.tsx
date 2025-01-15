import React from 'react';
import './TranslationProgress.css';

interface TranslationProgressProps {
  current: number;
  total: number;
  status: 'idle' | 'translating' | 'completed' | 'error';
  errorMessage?: string;
}

/**
 * 翻译进度组件
 * 显示当前翻译进度、总数和状态
 */
export const TranslationProgress: React.FC<TranslationProgressProps> = ({
  current,
  total,
  status,
  errorMessage
}) => {
  const percentage = Math.round((current / total) * 100) || 0;

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return '准备就绪';
      case 'translating':
        return `正在翻译... ${current}/${total}`;
      case 'completed':
        return '翻译完成';
      case 'error':
        return `出错: ${errorMessage}`;
      default:
        return '';
    }
  };

  return (
    <div className="translation-progress">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="progress-text">
        <span className="percentage">{percentage}%</span>
        <span className="status">{getStatusText()}</span>
      </div>
      {status === 'completed' && (
        <div className="completion-summary">
          <p>成功翻译 {total} 个元素</p>
          <button onClick={() => window.parent.postMessage({ pluginMessage: { type: 'close-plugin' }}, '*')}>
            完成
          </button>
        </div>
      )}
    </div>
  );
}; 