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
      // 发送保存设置消息
      parent.postMessage({
        pluginMessage: {
          type: 'save-settings',
          settings
        }
      }, '*');

      // 监听保存结果
      const handleSaveResponse = (event: MessageEvent) => {
        const message = event.data.pluginMessage;
        if (message && message.type === 'settings-saved') {
          if (onClose) {
            onClose();
          }
        }
      };

      window.addEventListener('message', handleSaveResponse);
      setTimeout(() => {
        window.removeEventListener('message', handleSaveResponse);
        setIsSaving(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存设置失败');
      setIsSaving(false);
    }
  };

  return (
    <div className="settings-panel">
      <div className="settings-content">
        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        <div className="settings-form">
          <div className="form-group">
            <label htmlFor="provider">
              <span className="label-icon">🤖</span>
              AI 提供商
            </label>
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

          <div className="form-group">
            <label htmlFor="apiKey">
              <span className="label-icon">🔑</span>
              API 密钥
            </label>
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

          <div className="form-group">
            <label htmlFor="apiEndpoint">
              <span className="label-icon">🔌</span>
              API 端点
            </label>
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

          <div className="form-group">
            <label htmlFor="modelName">
              <span className="label-icon">🧠</span>
              模型名称
            </label>
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
            className={`save-button ${isSaving ? 'saving' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="spinner">⌛</span>
                保存中...
              </>
            ) : (
              <>
                <span className="button-icon">💾</span>
                保存设置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 