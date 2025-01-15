import { traverseNode } from './utils/traverse';
import { translateText } from './service/translation';
import { TranslationHistory } from './service/translation/TranslationHistory';

// 默认设置
const DEFAULT_SETTINGS = {
    apiKey: '',
    apiEndpoint: 'https://api.openai.com/v1/chat/completions',
    modelName: 'gpt-3.5-turbo',
    provider: 'openai'
} as const;

figma.showUI(__html__, { width: 400, height: 500 });

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
  position?: { x: number; y: number };
  style?: Record<string, any>;
  size?: {
    width: number;
    height: number;
  };
}

interface TranslationRecord {
  id: string;
  timestamp: number;
  parentNode: {
    id: string;
    name: string;
    type: string;
  };
  translations: TranslationItem[];
}

// 在父节点中查找对应的文本节点（基于位置和类型）
function findMatchingTextNode(parent: BaseNode, targetNode: TranslationItem): TextNode | null {
  const textNodes: TextNode[] = [];
  let unmatchedNodes: TextNode[] = [];
  
  // 收集所有文本节点
  function collectTextNodes(node: BaseNode) {
    if (node.type === "TEXT") {
      textNodes.push(node as TextNode);
    }
    
    if ('children' in node) {
      (node as any).children.forEach(collectTextNodes);
    }
  }
  
  collectTextNodes(parent);
  unmatchedNodes = [...textNodes];
  
  // 根据位置和其他属性找到最匹配的节点
  if (textNodes.length > 0) {
    // 1. 首先尝试精确的位置匹配
    if (targetNode.position) {
      const matchingNode = unmatchedNodes.find(node => {
        const xMatch = Math.abs(node.x - targetNode.position!.x) < 1;
        const yMatch = Math.abs(node.y - targetNode.position!.y) < 1;
        return xMatch && yMatch;
      });
      
      if (matchingNode) {
        unmatchedNodes = unmatchedNodes.filter(node => node !== matchingNode);
        return matchingNode;
      }
    }
    
    // 2. 尝试使用原始文本内容匹配
    const sourceTextMatch = unmatchedNodes.find(node => 
      node.characters === targetNode.sourceText
    );
    
    if (sourceTextMatch) {
      unmatchedNodes = unmatchedNodes.filter(node => node !== sourceTextMatch);
      return sourceTextMatch;
    }
    
    // 3. 尝试使用尺寸和样式匹配
    if (targetNode.size && targetNode.style?.fontName) {
      const sizeStyleMatch = unmatchedNodes.find(node => {
        // 检查尺寸
        const widthMatch = Math.abs(node.width - targetNode.size!.width) < 5;
        const heightMatch = Math.abs(node.height - targetNode.size!.height) < 5;
        
        // 检查字体
        const nodeFontName = node.fontName as FontName;
        const targetFontName = targetNode.style!.fontName as FontName;
        const fontMatch = nodeFontName.family === targetFontName.family &&
                         nodeFontName.style === targetFontName.style;
        
        return widthMatch && heightMatch && fontMatch;
      });
      
      if (sizeStyleMatch) {
        unmatchedNodes = unmatchedNodes.filter(node => node !== sizeStyleMatch);
        return sizeStyleMatch;
      }
    }
    
    // 4. 尝试仅使用字体匹配
    if (targetNode.style?.fontName) {
      const fontMatch = unmatchedNodes.find(node => {
        const nodeFontName = node.fontName as FontName;
        const targetFontName = targetNode.style!.fontName as FontName;
        return nodeFontName.family === targetFontName.family &&
               nodeFontName.style === targetFontName.style;
      });
      
      if (fontMatch) {
        unmatchedNodes = unmatchedNodes.filter(node => node !== fontMatch);
        return fontMatch;
      }
    }
    
    // 5. 如果还有未匹配的节点，返回第一个
    if (unmatchedNodes.length > 0) {
      const firstUnmatched = unmatchedNodes[0];
      unmatchedNodes = unmatchedNodes.slice(1);
      return firstUnmatched;
    }
  }
  
  return null;
}

async function regenerateTranslation(record: TranslationRecord) {
  try {
    console.log('[Figma Translator] Regenerating translation:', record);
    
    // 获取父节点
    const parentNode = figma.getNodeById(record.parentNode.id);
    if (!parentNode) {
      throw new Error('找不到原始图层，请确保图层仍然存在');
    }

    // 检查节点是否可以被克隆
    if (!('clone' in parentNode)) {
      throw new Error('无法克隆该类型的图层');
    }

    // 检查节点是否具有位置和尺寸属性
    if (!('x' in parentNode) || !('y' in parentNode) || !('width' in parentNode)) {
      throw new Error('图层缺少必要的位置或尺寸属性');
    }

    // 克隆整个父节点
    const clonedParent = parentNode.clone();
    clonedParent.name = `${parentNode.name} (Regenerated)`;

    // 设置克隆节点的位置
    const originalX = (parentNode as SceneNode).x;
    const originalY = (parentNode as SceneNode).y;
    const originalWidth = (parentNode as SceneNode).width;

    clonedParent.x = originalX + originalWidth + 100;
    clonedParent.y = originalY;
    
    // 获取所有需要加载的字体
    const fonts = new Set<FontName>();
    record.translations.forEach((item: TranslationItem) => {
      if (item.style?.fontName) {
        // 确保字体名称是有效的
        const fontName = item.style.fontName as FontName;
        if (fontName.family && fontName.style) {
          fonts.add(fontName);
        }
      }
    });
    
    // 加载所有需要的字体
    console.log('[Figma Translator] Loading fonts:', Array.from(fonts));
    try {
      await Promise.all(Array.from(fonts).map(async (font) => {
        console.log('[Figma Translator] Loading font:', font);
        await figma.loadFontAsync(font);
      }));
    } catch (fontError: any) {
      console.error('[Figma Translator] Failed to load fonts:', fontError);
      throw new Error(`字体加载失败: ${fontError.message}`);
    }
    
    // 遍历所有翻译项并更新对应的文本节点
    for (const item of record.translations) {
      try {
        // 在克隆的父节点中查找对应的文本节点
        const textNode = findMatchingTextNode(clonedParent, item);
        if (!textNode) {
          console.warn(`[Figma Translator] Matching text node not found for:`, item);
          continue;
        }

        // 设置字体
        if (item.style?.fontName) {
          textNode.fontName = item.style.fontName as FontName;
        }
        
        // 应用其他样式
        if (item.style) {
          Object.entries(item.style).forEach(([key, value]) => {
            if (key !== 'fontName' && key in textNode) {
              (textNode as any)[key] = value;
            }
          });
        }
        
        // 设置文本内容
        textNode.characters = item.translatedText;
        
        // 如果有位置信息，则更新位置
        if (item.position) {
          textNode.x = item.position.x;
          textNode.y = item.position.y;
        }
        
        // 如果有尺寸信息，设置尺寸
        if (item.size) {
          textNode.resize(item.size.width, item.size.height);
        }
        
        console.log(`[Figma Translator] Successfully updated node with text: ${item.translatedText}`);
      } catch (nodeError: any) {
        console.error(`[Figma Translator] Failed to update node:`, nodeError);
        throw new Error(`更新节点失败: ${nodeError.message}`);
      }
    }
    
    // 选中克隆的父节点
    figma.currentPage.selection = [clonedParent as SceneNode];
    
    // 将视图定位到克隆的父节点
    figma.viewport.scrollAndZoomIntoView([clonedParent as SceneNode]);
    
    figma.notify("翻译已重新生成");
  } catch (error: any) {
    console.error('[Figma Translator] Failed to regenerate translation:', error);
    figma.notify(`重新生成失败: ${error.message}`, { error: true });
  }
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
    else if (msg.type === 'regenerate-translation') {
        await regenerateTranslation(msg.record);
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

            // 用于收集所有翻译项
            const translations: Array<{
                sourceText: string;
                translatedText: string;
                elementId: string;
                elementType: string;
                position?: { x: number; y: number };
                style?: {
                    fontSize?: number;
                    fontName?: FontName;
                    textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
                    textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
                    fills?: Paint[];
                    effects?: Effect[];
                    constraints?: Constraints;
                };
                size?: {
                    width: number;
                    height: number;
                };
            }> = [];

            for (const node of selectedTextNodes) {
                // 更新进度
                translatedCount++;
                updateProgress(
                    Math.round((translatedCount / totalNodes) * 100),
                    `正在翻译第 ${translatedCount}/${totalNodes} 个文本图层`
                );

                // 创建一个克隆以保留原始文本
                const clone = node.clone();
                clone.x = node.x + node.width + 20;
                clone.y = node.y;

                // 加载字体
                await Promise.all(
                    node.getRangeAllFontNames(0, node.characters.length)
                        .map(figma.loadFontAsync)
                );

                // 翻译文本
                const sourceText = node.characters;
                const translated = await translateText(sourceText, settings);
                
                // 只有当翻译结果与原文不同时才更新和记录
                if (translated !== sourceText) {
                    clone.characters = translated;

                    // 收集翻译项
                    if (node.type === "TEXT") {
                        const fontSize = node.fontSize;
                        translations.push({
                            sourceText: sourceText,
                            translatedText: translated,
                            elementId: clone.id,
                            elementType: clone.type,
                            position: { x: clone.x, y: clone.y },
                            style: {
                                fontSize: typeof fontSize === 'number' ? fontSize : undefined,
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
            }

            // 如果有翻译项，保存到历史记录
            if (translations.length > 0) {
                const parentNode = selectedTextNodes[0].parent || figma.currentPage;
                await TranslationHistory.addTranslationBatch(parentNode, translations);
            }

            // 完成翻译，显示100%进度
            updateProgress(100, `已完成 ${totalNodes} 个文本图层的翻译！`);
            
            // 延迟一会儿再隐藏进度条，让用户能看到完成状态
            setTimeout(() => {
                figma.ui.postMessage({ 
                    type: 'translation-complete',
                    timestamp: Date.now()
                });
            }, 1500);

            figma.notify(`已翻译 ${translatedCount} 个文本图层`);
        } catch (error: any) {
            console.error('[Figma Translator] Translation failed:', error);
            figma.notify('翻译失败: ' + (error.message || '未知错误'));
            figma.ui.postMessage({ 
                type: 'translation-complete',
                timestamp: Date.now()
            });
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

            const clone = selection.clone();
            console.log('[Figma Translator] Created clone');
            
            // 用于收集所有翻译项
            const translations: Array<{
                sourceText: string;
                translatedText: string;
                elementId: string;
                elementType: string;
                position?: { x: number; y: number };
                style?: {
                    fontSize?: number;
                    fontName?: FontName;
                    textAlignHorizontal?: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
                    textAlignVertical?: "TOP" | "CENTER" | "BOTTOM";
                    fills?: Paint[];
                    effects?: Effect[];
                    constraints?: Constraints;
                };
                size?: {
                    width: number;
                    height: number;
                };
            }> = [];
            
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
                        const translated = await translateText(sourceText, settings);
                        
                        // 只有当翻译结果与原文不同时才更新和记录
                        if (translated !== sourceText) {
                            node.characters = translated;

                            // 收集翻译项
                            if (node.type === "TEXT") {
                                const fontSize = node.fontSize;
                                translations.push({
                                    sourceText: sourceText,
                                    translatedText: translated,
                                    elementId: node.id,
                                    elementType: node.type,
                                    position: { x: node.x, y: node.y },
                                    style: {
                                        fontSize: typeof fontSize === 'number' ? fontSize : undefined,
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
            
            console.log(`[Figma Translator] Translation completed: ${translatedCount} texts translated`);
            figma.notify(`Translation completed! (${translatedCount} texts translated)`);
        } catch (error: any) {
            console.error('[Figma Translator] Translation failed:', error);
            figma.notify('Translation failed: ' + (error.message || 'Unknown error'));
            figma.ui.postMessage({ 
                type: 'translation-complete',
                timestamp: Date.now()
            });
        }
    }

    if (command === 'settings') {
        // 打开设置UI
        console.log('[Figma Translator] Opening settings UI');
        figma.showUI(__html__, { width: 400, height: 500 });
    }
}); 