import React, { useState, useEffect } from 'react';
import '../styles/App.css';

interface Settings {
    apiKey: string;
    apiEndpoint: string;
    modelName: string;
    provider: 'openai' | 'deepseek' | 'custom';
}

// API提供商配置
const PROVIDERS = {
    openai: {
        name: 'OpenAI',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        models: [
            { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
            { value: 'gpt-4', label: 'GPT-4' },
            { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
        ]
    },
    deepseek: {
        name: 'Deepseek',
        endpoint: 'https://api.deepseek.com/chat/completions',
        models: [
            { value: 'deepseek-chat', label: 'DeepSeek Chat (V3)' },
            { value: 'deepseek-coder', label: 'Deepseek Coder' }
        ]
    },
    custom: {
        name: 'Custom Provider',
        endpoint: '',
        models: []
    }
};

const App: React.FC = () => {
    console.log('[Figma Translator] App component rendering...');

    const [settings, setSettings] = useState<Settings>(() => {
        console.log('[Figma Translator] Initializing settings state...');
        return {
            apiKey: '',
            apiEndpoint: PROVIDERS.openai.endpoint,
            modelName: 'gpt-3.5-turbo',
            provider: 'openai'
        };
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 加载保存的设置
    useEffect(() => {
        console.log('[Figma Translator] Load settings effect running...');
        try {
            console.log('[Figma Translator] Sending load-settings message...');
            parent.postMessage({ 
                pluginMessage: { 
                    type: 'load-settings' 
                }
            }, '*');
            console.log('[Figma Translator] Load-settings message sent');
        } catch (err) {
            console.error('[Figma Translator] Failed to send load-settings message:', err);
            setError('Failed to load settings');
        }
    }, []);

    // 监听来自插件的消息
    useEffect(() => {
        console.log('[Figma Translator] Setting up message listener...');
        
        const handleMessage = (event: MessageEvent) => {
            console.log('[Figma Translator] Message received:', event.data);
            const pluginMessage = event.data.pluginMessage;
            if (pluginMessage && pluginMessage.type === 'settings-loaded') {
                console.log('[Figma Translator] Settings loaded:', pluginMessage.settings);
                // 确保使用最新的 endpoint
                const loadedSettings = pluginMessage.settings as Settings;
                const provider = loadedSettings.provider;
                if (provider && provider in PROVIDERS) {
                    loadedSettings.apiEndpoint = PROVIDERS[provider as keyof typeof PROVIDERS].endpoint;
                }
                setSettings(loadedSettings);
                setLoading(false);
                
                // 如果 endpoint 已更新，自动保存更新后的设置
                if (loadedSettings.apiEndpoint !== pluginMessage.settings.apiEndpoint) {
                    console.log('[Figma Translator] Endpoint updated, auto-saving...');
                    parent.postMessage({ 
                        pluginMessage: { 
                            type: 'save-settings',
                            settings: loadedSettings
                        }
                    }, '*');
                }
            }
        };

        window.addEventListener('message', handleMessage);
        console.log('[Figma Translator] Message listener added');
        
        return () => {
            console.log('[Figma Translator] Cleaning up message listener...');
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    // 处理API提供商变更
    const handleProviderChange = (provider: Settings['provider']) => {
        console.log('[Figma Translator] Provider changed to:', provider);
        setSettings({
            ...settings,
            provider,
            apiEndpoint: PROVIDERS[provider].endpoint,
            modelName: PROVIDERS[provider].models[0]?.value || ''
        });
    };

    // 保存设置
    const handleSave = () => {
        console.log('[Figma Translator] Saving settings...');
        try {
            parent.postMessage({ 
                pluginMessage: { 
                    type: 'save-settings',
                    settings: settings
                }
            }, '*');
            console.log('[Figma Translator] Save settings message sent');
        } catch (err) {
            console.error('[Figma Translator] Failed to save settings:', err);
            setError('Failed to save settings');
        }
    };

    if (error) {
        console.log('[Figma Translator] Rendering error state:', error);
        return (
            <div className="app error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => setError(null)}>Dismiss</button>
            </div>
        );
    }

    if (loading) {
        console.log('[Figma Translator] Rendering loading state');
        return (
            <div className="app loading">
                <h2>Loading settings...</h2>
            </div>
        );
    }

    console.log('[Figma Translator] Rendering settings form');
    return (
        <div className="app">
            <h2>Figma Translator</h2>
            <div className="settings">
                <h3>Settings</h3>
                <div className="setting-item">
                    <label htmlFor="provider">API Provider:</label>
                    <select
                        id="provider"
                        value={settings.provider}
                        onChange={(e) => handleProviderChange(e.target.value as Settings['provider'])}
                    >
                        <option value="openai">OpenAI</option>
                        <option value="deepseek">Deepseek</option>
                        <option value="custom">Custom Provider</option>
                    </select>
                </div>
                
                <div className="setting-item">
                    <label htmlFor="apiKey">API Key:</label>
                    <input 
                        type="password" 
                        id="apiKey" 
                        value={settings.apiKey}
                        onChange={(e) => setSettings({...settings, apiKey: e.target.value})}
                        placeholder={`Enter your ${PROVIDERS[settings.provider].name} API key`}
                    />
                </div>

                <div className="setting-item">
                    <label htmlFor="apiEndpoint">API Endpoint:</label>
                    <input 
                        type="text" 
                        id="apiEndpoint" 
                        value={settings.apiEndpoint}
                        onChange={(e) => setSettings({...settings, apiEndpoint: e.target.value})}
                        placeholder="Enter API endpoint"
                        disabled={settings.provider !== 'custom'}
                    />
                    <small className="help-text">
                        {settings.provider === 'custom' 
                            ? 'Enter your custom API endpoint that supports OpenAI API format'
                            : `Default: ${PROVIDERS[settings.provider].endpoint}`}
                    </small>
                </div>

                <div className="setting-item">
                    <label htmlFor="modelName">Model Name:</label>
                    {settings.provider === 'custom' ? (
                        <input
                            type="text"
                            id="modelName"
                            value={settings.modelName}
                            onChange={(e) => setSettings({...settings, modelName: e.target.value})}
                            placeholder="Enter model name"
                        />
                    ) : (
                        <select 
                            id="modelName" 
                            value={settings.modelName}
                            onChange={(e) => setSettings({...settings, modelName: e.target.value})}
                        >
                            {PROVIDERS[settings.provider].models.map(model => (
                                <option key={model.value} value={model.value}>
                                    {model.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <button className="save-button" onClick={handleSave}>
                    Save Settings
                </button>
            </div>
        </div>
    );
};

export default App; 