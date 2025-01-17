import React, { useState, useEffect } from 'react';
import '../styles/index.css';

interface TranslationProgress {
    progress: number;
    message: string;
}

export const TranslationPanel: React.FC = () => {
    const [isTranslating, setIsTranslating] = useState(false);
    const [progress, setProgress] = useState<TranslationProgress>({ progress: 0, message: '' });

    useEffect(() => {
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
            }
        };
    }, []);

    const handleTranslate = () => {
        // 发送翻译消息给插件
        parent.postMessage({ pluginMessage: { type: 'translate' } }, '*');
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
                    <p>选择要翻译的文本图层，然后点击下方按钮开始翻译。</p>
                    <button className="primary-button" onClick={handleTranslate}>
                        开始翻译
                    </button>
                </div>
            )}
        </div>
    );
}; 