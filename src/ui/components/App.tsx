import React, { useState } from 'react';
import { TranslationHistoryView } from './translation/TranslationHistory';
import { SettingsPanel } from './settings/SettingsPanel';
import { TranslationPanel } from './TranslationPanel';
import './App.css';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('translate');

  return (
    <div className="app">
      <div className="tabs">
        <div className="tab-list">
          <button 
            className={`tab-button ${activeTab === 'translate' ? 'active' : ''}`}
            onClick={() => setActiveTab('translate')}
          >
            <span className="tab-icon">🌐</span>
            <span className="tab-text">翻译</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <span className="tab-icon">📋</span>
            <span className="tab-text">历史记录</span>
          </button>
          <button 
            className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="tab-icon">⚙️</span>
            <span className="tab-text">设置</span>
          </button>
        </div>
      </div>

      <div className="content">
        {activeTab === 'translate' && <TranslationPanel />}
        {activeTab === 'history' && (
          <TranslationHistoryView onClose={() => setActiveTab('translate')} />
        )}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
}; 