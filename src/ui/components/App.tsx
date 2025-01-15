import React, { useState, useEffect } from 'react';
import '../styles/App.css';
import '../styles/SVGGeneratorPanel.css';
import '../styles/SettingsPanel.css';
import { SVGGeneratorPanel } from './SVGGeneratorPanel';
import { TranslationHistoryView } from './translation/TranslationHistory';
import { SettingsPanel } from './settings/SettingsPanel';
import { SVGGenerationOptions } from '../../main/service/svg/SVGGenerationService';

export function App() {
  const [currentView, setCurrentView] = useState<'translation' | 'svg' | 'settings' | 'history'>('translation');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translationProgress, setTranslationProgress] = useState<{
    percent: number;
    message: string;
  } | null>(null);

  useEffect(() => {
    // 监听来自插件的消息
    window.onmessage = (event) => {
      const message = event.data.pluginMessage;
      if (!message) return;

      switch (message.type) {
        case 'translation-progress':
          setTranslationProgress({
            percent: message.progress,
            message: message.message
          });
          break;
        case 'translation-complete':
          setTimeout(() => setTranslationProgress(null), 1500);
          break;
        case 'generate-error':
          setError(message.error);
          setIsGenerating(false);
          break;
        case 'generate-success':
          setIsGenerating(false);
          break;
      }
    };
  }, []);

  const handleGenerate = async (options: SVGGenerationOptions) => {
    setIsGenerating(true);
    setError(null);

    try {
      await parent.postMessage({ pluginMessage: {
        type: 'generate-svg',
        options,
      } }, '*');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成SVG时发生错误');
      setIsGenerating(false);
    }
  };

  const renderNavigation = () => (
    <div className="navigation">
      <button
        className={`nav-button ${currentView === 'translation' ? 'active' : ''}`}
        onClick={() => setCurrentView('translation')}
      >
        翻译
      </button>
      <button
        className={`nav-button ${currentView === 'svg' ? 'active' : ''}`}
        onClick={() => setCurrentView('svg')}
      >
        SVG生成
      </button>
      <button
        className={`nav-button ${currentView === 'settings' ? 'active' : ''}`}
        onClick={() => setCurrentView('settings')}
      >
        设置
      </button>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'settings':
        return (
          <SettingsPanel
            onClose={() => setCurrentView('translation')}
          />
        );
      case 'svg':
        return (
          <div className="svg-view">
            <div className="header">
              <h1>SVG生成器</h1>
            </div>
            <div className="main-content">
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}
              <SVGGeneratorPanel
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>
          </div>
        );
      case 'history':
        return (
          <TranslationHistoryView
            onClose={() => setCurrentView('translation')}
          />
        );
      case 'translation':
      default:
        return (
          <div className="translation-panel">
            <div className="header">
              <h1>Figma 翻译助手</h1>
              <button 
                className="history-button"
                onClick={() => setCurrentView('history')}
              >
                查看历史
              </button>
            </div>
            <div className="main-content">
              {translationProgress && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${translationProgress.percent}%` }}
                    />
                  </div>
                  <div className="progress-message">
                    {translationProgress.message}
                  </div>
                </div>
              )}
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <p>选择要翻译的文本图层，然后点击右键菜单中的"Translate to English"开始翻译。</p>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app">
      {renderNavigation()}
      {renderContent()}
    </div>
  );
} 