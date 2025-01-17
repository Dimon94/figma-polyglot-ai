import React, { useState, useEffect } from 'react';
import './TranslationPanel.css';

interface TranslationPanelProps {
    onClose?: () => void;
}

interface ProgressState {
    progress: number;
    message: string;
}

export const TranslationPanel: React.FC<TranslationPanelProps> = () => {
    const [isTranslating, setIsTranslating] = useState(false);
    const [progress, setProgress] = useState<ProgressState>({ progress: 0, message: '' });
    const [targetLanguage, setTargetLanguage] = useState('en');
    const [supportedLanguages, setSupportedLanguages] = useState<Array<{ code: string; name: string }>>([]);

    useEffect(() => {
        // 获取支持的语言列表
        parent.postMessage({ pluginMessage: { type: 'get-supported-languages' } }, '*');

        // 监听来自插件的消息
        window.onmessage = (event) => {
            const message = event.data.pluginMessage;
            if (!message) return;

            if (message.type === 'translation-progress') {
                setIsTranslating(true);
                setProgress({
                    progress: message.progress,
                    message: message.message
                });
            } else if (message.type === 'translation-complete') {
                setIsTranslating(false);
                setProgress({ progress: 0, message: '' });
            } else if (message.type === 'supported-languages') {
                setSupportedLanguages(message.languages);
            }
        };
    }, []);

    const handleTranslate = () => {
        // 发送翻译消息给插件，包含目标语言信息
        parent.postMessage({ 
            pluginMessage: { 
                type: 'translate',
                targetLanguage 
            } 
        }, '*');
    };

    return (
        <div className="translation-panel">
            {isTranslating ? (
                <div className="progress-container">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill"
                            style={{ width: `${progress.progress}%` }}
                        />
                    </div>
                    <div className="progress-text">
                        {progress.message}
                    </div>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🌐</div>
                    <h2>开始翻译</h2>
                    <p>选择要翻译的文本图层和目标语言，然后点击下方按钮开始翻译。</p>
                    
                    <div className="language-selector">
                        <label htmlFor="target-language">目标语言：</label>
                        <select 
                            id="target-language"
                            value={targetLanguage}
                            onChange={(e) => setTargetLanguage(e.target.value)}
                            className="language-select"
                        >
                            {supportedLanguages.map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button className="primary-button" onClick={handleTranslate}>
                        开始翻译
                    </button>
                </div>
            )}
        </div>
    );
}; 