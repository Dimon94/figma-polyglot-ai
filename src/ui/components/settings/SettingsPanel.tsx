import React, { useState, useEffect } from 'react';
import { AISettings } from '../../../main/service/settings/SettingsService';

interface SettingsPanelProps {
  onClose?: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<AISettings>({
    apiKey: '',
    apiEndpoint: '',
    modelName: '',
    provider: 'openai'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 加载当前设置
    parent.postMessage({ pluginMessage: { type: 'load-settings' } }, '*');

    // 监听设置加载响应
    const handleMessage = (event: MessageEvent) => {
      const message = event.data.pluginMessage;
      if (message && message.type === 'settings-loaded') {
        setSettings(message.settings);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      await parent.postMessage({
        pluginMessage: {
          type: 'save-settings',
          settings
        }
      }, '*');
      
      if (onClose) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存设置失败');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="header">
        <h1>设置</h1>
        {onClose && (
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="main-content">
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="settings-form">
          <div className="setting-item">
            <label htmlFor="provider">AI 提供商</label>
            <select
              id="provider"
              value={settings.provider}
              onChange={(e) => setSettings({
                ...settings,
                provider: e.target.value as AISettings['provider']
              })}
            >
              <option value="openai">OpenAI</option>
              <option value="deepseek">DeepSeek</option>
              <option value="custom">自定义</option>
            </select>
          </div>

          <div className="setting-item">
            <label htmlFor="apiKey">API 密钥</label>
            <input
              type="password"
              id="apiKey"
              value={settings.apiKey}
              onChange={(e) => setSettings({
                ...settings,
                apiKey: e.target.value
              })}
              placeholder="输入 API 密钥"
            />
          </div>

          <div className="setting-item">
            <label htmlFor="apiEndpoint">API 端点</label>
            <input
              type="text"
              id="apiEndpoint"
              value={settings.apiEndpoint}
              onChange={(e) => setSettings({
                ...settings,
                apiEndpoint: e.target.value
              })}
              placeholder="输入 API 端点"
            />
            <span className="help-text">
              例如：https://api.openai.com/v1/chat/completions
            </span>
          </div>

          <div className="setting-item">
            <label htmlFor="modelName">模型名称</label>
            <input
              type="text"
              id="modelName"
              value={settings.modelName}
              onChange={(e) => setSettings({
                ...settings,
                modelName: e.target.value
              })}
              placeholder="输入模型名称"
            />
            <span className="help-text">
              例如：gpt-4、gpt-3.5-turbo
            </span>
          </div>

          <button
            className="save-button"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '保存中...' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  );
}; 