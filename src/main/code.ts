import { traverseNode } from './utils/traverse';
import { translateText } from './service/translation';

// 默认设置
const DEFAULT_SETTINGS = {
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    modelName: 'gpt-3.5-turbo',
    provider: 'openai'
} as const;

// 开启控制台调试日志
const DEBUG = true;
function debug(...args: any[]) {
    if (DEBUG) {
        console.log('[Figma Translator]', ...args);
    }
}

figma.showUI(__html__, { width: 400, height: 500 });

// 更新翻译进度
function updateProgress(percent: number, message: string) {
    figma.ui.postMessage({ 
        type: 'translation-progress',
        progress: percent,
        message: message
    });
}

// 监听来自UI的消息
figma.ui.onmessage = async (msg) => {
    console.log('[Figma Translator] Received message:', msg);

    if (msg.type === 'load-settings') {
        // 加载设置
        const settings = await figma.clientStorage.getAsync('settings') || DEFAULT_SETTINGS;
        console.log('[Figma Translator] Loaded settings:', settings);
        figma.ui.postMessage({ type: 'settings-loaded', settings });
    }
    else if (msg.type === 'save-settings') {
        // 保存设置
        await figma.clientStorage.setAsync('settings', msg.settings);
        console.log('[Figma Translator] Settings saved:', msg.settings);
        figma.notify('Settings saved successfully!');
    }
    else if (msg.type === 'translate') {
        // 检查是否有选中的文本图层
        const selectedTextNodes = figma.currentPage.selection.filter(
            node => node.type === "TEXT"
        ) as TextNode[];

        if (selectedTextNodes.length === 0) {
            figma.notify("Please select at least one text layer");
            return;
        }

        // 加载设置
        const settings = await figma.clientStorage.getAsync('settings');
        console.log('[Figma Translator] Translation settings:', settings);

        if (!settings || !settings.apiKey) {
            figma.notify("Please configure API settings first");
            figma.showUI(__html__);
            return;
        }

        // 开始翻译
        try {
            let translatedCount = 0;
            const totalNodes = selectedTextNodes.length;
            
            // 显示初始进度
            updateProgress(0, `准备翻译 ${totalNodes} 个文本图层...`);

            for (const node of selectedTextNodes) {
                // 更新进度
                const progress = Math.round((translatedCount / totalNodes) * 100);
                updateProgress(
                    progress,
                    `正在翻译第 ${translatedCount + 1}/${totalNodes} 个文本图层 (${progress}%)`
                );

                // 创建一个克隆以保留原始文本
                const clone = node.clone();
                clone.x = node.x + node.width + 20;
                clone.y = node.y;

                // 加载字体
                console.log('[Figma Translator] Loading fonts for node:', node.name);
                await Promise.all(
                    node.getRangeAllFontNames(0, node.characters.length)
                        .map(figma.loadFontAsync)
                );
                console.log('[Figma Translator] Fonts loaded successfully');

                // 翻译文本
                const translated = await translateText(node.characters, settings);
                clone.characters = translated;
                translatedCount++;
            }

            // 完成翻译，显示100%进度
            updateProgress(100, `已完成 ${totalNodes} 个文本图层的翻译！`);
            
            // 延迟一会儿再隐藏进度条，让用户能看到完成状态
            setTimeout(() => {
                figma.ui.postMessage({ type: 'translation-complete' });
            }, 1500);

            figma.notify(`已翻译 ${translatedCount} 个文本图层`);
        } catch (error: any) {
            console.error('[Figma Translator] Translation failed:', error);
            figma.notify('翻译失败: ' + (error.message || '未知错误'));
            figma.ui.postMessage({ type: 'translation-complete' });
        }
    }
};

// 注册翻译命令
figma.parameters.on('input', ({ key, result }) => {
    console.log('[Figma Translator] Command input:', { key });
    switch (key) {
        case 'translate':
            result.setSuggestions(['Translate to English']);
            break;
        default:
            return;
    }
});

// 处理命令
figma.on('run', async ({ command }) => {
    console.log('[Figma Translator] Running command:', command);

    if (command === 'translate') {
        // 检查是否有选中的节点
        if (figma.currentPage.selection.length === 0) {
            console.log('[Figma Translator] No selection found');
            figma.notify('Please select at least one layer');
            return;
        }

        try {
            // 获取API配置
            const settings = await figma.clientStorage.getAsync('settings');
            console.log('[Figma Translator] Translation settings:', settings);
            
            if (!settings?.apiKey || !settings?.apiEndpoint || !settings?.modelName) {
                console.log('[Figma Translator] Missing API configuration');
                figma.notify('Please configure API settings first');
                figma.showUI(__html__, { width: 400, height: 500 });
                return;
            }

            // 开始翻译过程
            const selection = figma.currentPage.selection[0];
            console.log('[Figma Translator] Selected node:', {
                type: selection.type,
                name: selection.name,
                id: selection.id
            });

            const clone = selection.clone();
            console.log('[Figma Translator] Created clone');
            
            // 遍历节点并翻译
            let translatedCount = 0;
            await traverseNode(clone, async (node) => {
                if ('characters' in node) {
                    console.log('[Figma Translator] Translating text:', {
                        text: node.characters,
                        nodeType: node.type,
                        nodeName: node.name
                    });
                    try {
                        // 加载字体
                        if (node.type === "TEXT") {
                            console.log('[Figma Translator] Loading fonts for node:', node.name);
                            await Promise.all(
                                node.getRangeAllFontNames(0, node.characters.length)
                                    .map(figma.loadFontAsync)
                            );
                            console.log('[Figma Translator] Fonts loaded successfully');
                        }

                        const translated = await translateText(node.characters, settings);
                        node.characters = translated;
                        translatedCount++;
                        console.log('[Figma Translator] Node translated successfully:', {
                            original: node.characters,
                            translated: translated,
                            nodeType: node.type,
                            nodeName: node.name
                        });
                    } catch (error: any) {
                        console.error('[Figma Translator] Failed to translate node:', {
                            text: node.characters,
                            nodeType: node.type,
                            nodeName: node.name,
                            error: error.message
                        });
                        // 继续处理其他节点
                    }
                }
            });

            // 将克隆的节点放在原始节点旁边
            clone.x = selection.x + selection.width + 100;
            clone.y = selection.y;

            // 选中新创建的节点
            figma.currentPage.selection = [clone];
            
            console.log(`[Figma Translator] Translation completed: ${translatedCount} texts translated`);
            figma.notify(`Translation completed! (${translatedCount} texts translated)`);
        } catch (error: any) {
            console.error('[Figma Translator] Translation failed:', error);
            figma.notify('Translation failed: ' + (error.message || 'Unknown error'));
        }
    }

    if (command === 'settings') {
        // 打开设置UI
        console.log('[Figma Translator] Opening settings UI');
        figma.showUI(__html__, { width: 400, height: 500 });
    }
}); 