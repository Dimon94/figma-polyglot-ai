export interface TranslationItem {
  sourceText: string;
  translatedText: string;
  elementId: string;
  elementType: string;
  targetLanguage?: string;
  position?: { x: number; y: number };
  style?: Record<string, any>;
  size?: {
    width: number;
    height: number;
  };
}

export interface TranslationRecord {
  id: string;
  timestamp: number;
  parentNode: {
    id: string;
    name: string;
    type: string;
  };
  translations: TranslationItem[];
}

export class TranslationHistory {
  private static readonly STORAGE_KEY = 'translation_history';
  private static readonly MAX_RECORDS = 1000;

  static async addTranslationBatch(parentNode: BaseNode, translations: TranslationItem[]): Promise<void> {
    try {
      const history = await this.getHistory();
      const newRecord: TranslationRecord = {
        id: this.generateId(),
        timestamp: Date.now(),
        parentNode: {
          id: parentNode.id,
          name: parentNode.name,
          type: parentNode.type
        },
        translations: translations
      };

      history.unshift(newRecord);
      
      if (history.length > this.MAX_RECORDS) {
        history.pop();
      }

      await figma.clientStorage.setAsync(this.STORAGE_KEY, history);
      console.log('[Figma Translator] Added translation batch:', newRecord);
    } catch (error) {
      console.error('[Figma Translator] Failed to add translation batch:', error);
    }
  }

  static async getHistory(): Promise<TranslationRecord[]> {
    try {
      const history = await figma.clientStorage.getAsync(this.STORAGE_KEY);
      return Array.isArray(history) ? history : [];
    } catch (error) {
      console.error('[Figma Translator] Failed to get translation history:', error);
      return [];
    }
  }

  static async clearHistory(): Promise<void> {
    try {
      await figma.clientStorage.setAsync(this.STORAGE_KEY, []);
      console.log('[Figma Translator] Cleared translation history');
    } catch (error) {
      console.error('[Figma Translator] Failed to clear translation history:', error);
    }
  }

  static async searchHistory(query: string): Promise<TranslationRecord[]> {
    const history = await this.getHistory();
    const lowerQuery = query.toLowerCase();
    
    return history.filter(record => 
      record.translations.some(item =>
        item.sourceText.toLowerCase().includes(lowerQuery) ||
        item.translatedText.toLowerCase().includes(lowerQuery)
      ) ||
      record.parentNode.name.toLowerCase().includes(lowerQuery)
    );
  }

  static async regenerateTranslation(record: TranslationRecord): Promise<void> {
    try {
      // 创建一个新的Frame来容纳所有翻译后的文本
      const newFrame = figma.createFrame();
      newFrame.name = `Translated ${record.parentNode.name}`;
      
      // 设置Frame的初始大小
      newFrame.resize(1, 1); // 临时大小，后面会根据内容自动调整

      // 遍历并重新创建所有翻译的文本节点
      for (const item of record.translations) {
        // 创建新的文本节点
        const newNode = figma.createText();
        
        // 加载字体
        if (item.style?.fontName) {
          await figma.loadFontAsync(item.style.fontName);
        } else {
          await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        }

        // 设置文本内容
        newNode.characters = item.translatedText;
        
        // 应用样式
        if (item.style) {
          if (item.style.fontSize) newNode.fontSize = item.style.fontSize;
          if (item.style.textAlignHorizontal) newNode.textAlignHorizontal = item.style.textAlignHorizontal;
          if (item.style.textAlignVertical) newNode.textAlignVertical = item.style.textAlignVertical;
          if (item.style.fills) newNode.fills = item.style.fills;
          if (item.style.effects) newNode.effects = item.style.effects;
          if (item.style.constraints) newNode.constraints = item.style.constraints;
        }
        
        // 设置位置
        if (item.position) {
          newNode.x = item.position.x;
          newNode.y = item.position.y;
        }
        
        // 设置尺寸
        if (item.size) {
          newNode.resize(item.size.width, item.size.height);
        }
        
        // 将节点添加到Frame中
        newFrame.appendChild(newNode);
      }

      // 调整Frame的大小以适应所有内容
      const padding = 20;
      const bounds = newFrame.absoluteBoundingBox!;
      newFrame.resize(
        bounds.width + padding * 2,
        bounds.height + padding * 2
      );

      // 将Frame放置在当前选中内容的旁边
      const selection = figma.currentPage.selection[0];
      if (selection) {
        newFrame.x = selection.x + selection.width + 100;
        newFrame.y = selection.y;
      }

      // 选中新创建的Frame
      figma.currentPage.selection = [newFrame];
      
      console.log('[Figma Translator] Regenerated translation batch:', record);
    } catch (error) {
      console.error('[Figma Translator] Failed to regenerate translation:', error);
      throw error;
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
} 