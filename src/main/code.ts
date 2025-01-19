import { TranslationHistory } from './service/translation/TranslationHistory';
import { AIModelService } from './service/ai/AIModelService';
import { SettingsService } from './service/settings/SettingsService';
import { TranslationService } from './service/translation/TranslationService';
import { traverseNode } from './utils/traverse';

// 初始化服务
const settingsService = SettingsService.getInstance();
const aiService = new AIModelService();

// 初始化设置
(async () => {
    try {
        // 加载设置
        const settings = await settingsService.loadSettings();
        console.log('[Figma Translator] Initial settings loaded:', settings);
        
        // 更新 AI 服务的设置
        aiService.updateSettings(settings);
    } catch (error) {
        console.error('[Figma Translator] Failed to initialize settings:', error);
    }
})();

// 显示UI
figma.showUI(__html__, {
    width: 450,
    height: 550,
});

// 更新翻译进度
function updateProgress(percent: number, message: string) {
    figma.ui.postMessage({ 
        type: 'translation-progress',
        progress: percent,
        message: message,
        timestamp: Date.now()  // 添加时间戳确保消息总是被处理
    });
}

interface TranslationItem {
    sourceText: string;
    translatedText: string;
    elementId: string;
    elementType: string;
    targetLanguage?: string; // 目标语言代码
    position?: { x: number; y: number };
    style?: Record<string, any>;
    size?: {
        width: number;
        height: number;
    };
}

// 处理翻译逻辑
async function handleTranslation(targetLanguage: string = 'en') {
    try {
        console.log('[Figma Translator] Starting translation...');
        console.log('[Figma Translator] Current selection:', figma.currentPage.selection);
        console.log('[Figma Translator] Target language:', targetLanguage);

        // 检查是否有选中的节点
        if (figma.currentPage.selection.length === 0) {
            figma.notify("请选择要翻译的图层");
            return;
        }

        // 获取当前设置
        const currentSettings = await settingsService.loadSettings();
        console.log('[Figma Translator] Current settings:', currentSettings);
        
        // 检查API设置
        if (!currentSettings.apiKey) {
            figma.notify("请先配置API密钥");
            return;
        }

        // 更新 AI 服务的设置，添加目标语言
        aiService.updateSettings({
            ...currentSettings,
            targetLanguage
        });

        // 获取选中的节点
        const selection = figma.currentPage.selection[0];
        console.log('[Figma Translator] Selected node:', {
            type: selection.type,
            name: selection.name,
            id: selection.id
        });

        // 首先计算需要翻译的文本节点总数
        let totalTextNodes = 0;
        await traverseNode(selection, async (node) => {
            if ('characters' in node) {
                totalTextNodes++;
            }
        });

        console.log('[Figma Translator] Total text nodes to translate:', totalTextNodes);
        
        // 显示初始进度
        updateProgress(0, `准备翻译 ${totalTextNodes} 个文本图层...`);

        // 创建整个选中节点的克隆
        const clone = selection.clone();
        console.log('[Figma Translator] Created clone');

        // 将克隆的节点放在原始节点旁边
        clone.x = selection.x + selection.width + 100;
        clone.y = selection.y;
        
        // 用于收集所有翻译项
        const translations: TranslationItem[] = [];
        
        // 遍历节点并翻译
        let translatedCount = 0;
        await traverseNode(clone, async (node) => {
            if ('characters' in node) {
                try {
                    // 更新进度
                    translatedCount++;
                    updateProgress(
                        Math.round((translatedCount / totalTextNodes) * 100),
                        `正在翻译第 ${translatedCount}/${totalTextNodes} 个文本图层`
                    );

                    // 加载字体
                    if (node.type === "TEXT") {
                        await Promise.all(
                            node.getRangeAllFontNames(0, node.characters.length)
                                .map(figma.loadFontAsync)
                        );
                    }

                    const sourceText = node.characters;
                    console.log('[Figma Translator] Translating text:', sourceText);
                    const prompt = `Translate the following text to ${targetLanguage}:\n${sourceText}`;
                    
                    try {
                        const translated = await aiService.generateContent(prompt, {
                            model: currentSettings.modelName,
                            temperature: 0.3,
                        });

                        console.log('[Figma Translator] Translated text:', translated);

                        // 只有当翻译结果与原文不同时才更新和记录
                        if (translated && translated !== sourceText) {
                            node.characters = translated;

                            // 收集翻译项
                            if (node.type === "TEXT") {
                                translations.push({
                                    sourceText: sourceText,
                                    translatedText: translated,
                                    elementId: node.id,
                                    elementType: node.type,
                                    targetLanguage,
                                    position: { x: node.x, y: node.y },
                                    style: {
                                        fontSize: typeof node.fontSize === 'number' ? node.fontSize : undefined,
                                        fontName: node.fontName as FontName,
                                        textAlignHorizontal: node.textAlignHorizontal,
                                        textAlignVertical: node.textAlignVertical,
                                        fills: node.fills as Paint[],
                                        effects: node.effects as Effect[],
                                        constraints: node.constraints
                                    },
                                    size: {
                                        width: node.width,
                                        height: node.height
                                    }
                                });
                            }
                        }
                    } catch (translationError: any) {
                        console.error('[Figma Translator] Translation error:', translationError);
                        figma.notify(`翻译失败: ${translationError.message}`, { error: true });
                    }
                } catch (nodeError: any) {
                    console.error('[Figma Translator] Failed to translate node:', nodeError);
                    figma.notify(`翻译节点失败: ${nodeError.message}`, { error: true });
                    // 继续处理其他节点
                }
            }
        });

        // 选中新创建的节点
        figma.currentPage.selection = [clone];

        // 如果有翻译项，保存到历史记录
        if (translations.length > 0) {
            await TranslationHistory.addTranslationBatch(selection, translations);
        }

        // 完成翻译，显示100%进度
        updateProgress(100, `已完成 ${totalTextNodes} 个文本图层的翻译！`);

        // 延迟一会儿再隐藏进度条
        setTimeout(() => {
            figma.ui.postMessage({ 
                type: 'translation-complete',
                timestamp: Date.now()
            });
        }, 1500);

        figma.notify(`已翻译 ${translatedCount} 个文本图层`);
    } catch (error: any) {
        console.error('[Figma Translator] Translation failed:', error);
        figma.notify(`翻译失败: ${error.message}`, { error: true });
    }
}

// 处理仅翻译逻辑（不复制）
async function handleTranslateOnly(targetLanguage: string = 'en') {
    try {
        console.log('[Figma Translator] Starting translation without copy...');
        
        // 检查是否有选中的节点
        if (figma.currentPage.selection.length === 0) {
            figma.notify("请选择要翻译的图层");
            return;
        }

        // 获取当前设置
        const currentSettings = await settingsService.loadSettings();
        
        // 检查API设置
        if (!currentSettings.apiKey) {
            figma.notify("请先配置API密钥");
            return;
        }

        // 更新 AI 服务的设置
        aiService.updateSettings({
            ...currentSettings,
            targetLanguage
        });

        // 获取选中的节点
        const selection = figma.currentPage.selection[0];

        // 计算需要翻译的文本节点总数
        let totalTextNodes = 0;
        await traverseNode(selection, async (node) => {
            if ('characters' in node) {
                totalTextNodes++;
            }
        });
        
        // 显示初始进度
        updateProgress(0, `准备翻译 ${totalTextNodes} 个文本图层...`);
        
        // 用于收集所有翻译项
        const translations: TranslationItem[] = [];
        
        // 遍历节点并翻译
        let translatedCount = 0;
        await traverseNode(selection, async (node) => {
            if ('characters' in node) {
                try {
                    // 更新进度
                    translatedCount++;
                    updateProgress(
                        Math.round((translatedCount / totalTextNodes) * 100),
                        `正在翻译第 ${translatedCount}/${totalTextNodes} 个文本图层`
                    );

                    // 加载字体
                    if (node.type === "TEXT") {
                        await Promise.all(
                            node.getRangeAllFontNames(0, node.characters.length)
                                .map(figma.loadFontAsync)
                        );
                    }

                    const sourceText = node.characters;
                    const prompt = `Translate the following text to ${targetLanguage}:\n${sourceText}`;
                    
                    try {
                        const translated = await aiService.generateContent(prompt, {
                            model: currentSettings.modelName,
                            temperature: 0.3,
                        });

                        // 只有当翻译结果与原文不同时才更新和记录
                        if (translated && translated !== sourceText) {
                            node.characters = translated;

                            // 收集翻译项
                            if (node.type === "TEXT") {
                                translations.push({
                                    sourceText: sourceText,
                                    translatedText: translated,
                                    elementId: node.id,
                                    elementType: node.type,
                                    targetLanguage,
                                    position: { x: node.x, y: node.y },
                                    style: {
                                        fontSize: typeof node.fontSize === 'number' ? node.fontSize : undefined,
                                        fontName: node.fontName as FontName,
                                        textAlignHorizontal: node.textAlignHorizontal,
                                        textAlignVertical: node.textAlignVertical,
                                        fills: node.fills as Paint[],
                                        effects: node.effects as Effect[],
                                        constraints: node.constraints
                                    },
                                    size: {
                                        width: node.width,
                                        height: node.height
                                    }
                                });
                            }
                        }
                    } catch (translationError: any) {
                        console.error('[Figma Translator] Translation error:', translationError);
                        figma.notify(`翻译失败: ${translationError.message}`, { error: true });
                    }
                } catch (nodeError: any) {
                    console.error('[Figma Translator] Failed to translate node:', nodeError);
                    figma.notify(`翻译节点失败: ${nodeError.message}`, { error: true });
                }
            }
        });

        // 如果有翻译项，保存到历史记录
        if (translations.length > 0) {
            await TranslationHistory.addTranslationBatch(selection, translations);
        }

        // 完成翻译，显示100%进度
        updateProgress(100, `已完成 ${totalTextNodes} 个文本图层的翻译！`);

        // 延迟一会儿再隐藏进度条
        setTimeout(() => {
            figma.ui.postMessage({ 
                type: 'translation-complete',
                timestamp: Date.now()
            });
        }, 1500);

        figma.notify(`已翻译 ${translatedCount} 个文本图层`);
    } catch (error: any) {
        console.error('[Figma Translator] Translation failed:', error);
        figma.notify(`翻译失败: ${error.message}`, { error: true });
    }
}

// 处理命令
if (figma.command === 'translate') {
    console.log('[Figma Translator] Translate command received');
    handleTranslation();
}

// 处理来自UI的消息
figma.ui.onmessage = async (msg) => {
    try {
        if (msg.type === 'translate') {
            if (msg.mode === 'copy') {
                await handleTranslation(msg.targetLanguage);
            } else {
                await handleTranslateOnly(msg.targetLanguage);
            }
        }
        else if (msg.type === 'load-settings') {
            // 加载设置
            const settings = await settingsService.loadSettings();
            figma.ui.postMessage({ 
                type: 'settings-loaded', 
                settings 
            });
        }
        else if (msg.type === 'save-settings') {
            // 保存设置
            await settingsService.saveSettings(msg.settings);
            // 更新 AI 服务的设置
            aiService.updateSettings(msg.settings);
            console.log('[Figma Plugin] Settings saved:', msg.settings);
            figma.notify('设置已保存');
            // 发送保存成功消息
            figma.ui.postMessage({ type: 'settings-saved' });
        }
        else if (msg.type === 'get-history') {
            // 获取翻译历史记录
            const records = await TranslationHistory.getHistory();
            console.log('[Figma Translator] Loaded translation history:', records);
            figma.ui.postMessage({ type: 'history-loaded', records });
        }
        else if (msg.type === 'search-history') {
            // 搜索翻译历史记录
            const records = await TranslationHistory.searchHistory(msg.query);
            console.log('[Figma Translator] Search translation history:', { query: msg.query, results: records });
            figma.ui.postMessage({ type: 'history-searched', records });
        }
        else if (msg.type === 'clear-history') {
            // 清除翻译历史记录
            await TranslationHistory.clearHistory();
            console.log('[Figma Translator] Translation history cleared');
            figma.ui.postMessage({ type: 'history-cleared' });
            figma.notify('历史记录已清空');
        }
        else if (msg.type === 'get-supported-languages') {
            // 获取支持的语言列表
            const languages = TranslationService.getSupportedLanguages();
            figma.ui.postMessage({ 
                type: 'supported-languages',
                languages 
            });
        }
    } catch (error: any) {
        console.error('[Figma Translator] Failed to handle message:', error);
        figma.notify(`处理消息失败: ${error.message}`, { error: true });
    }
};