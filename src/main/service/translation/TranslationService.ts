import { AIModelService } from '../ai/AIModelService';
import { TranslationHistory, TranslationItem } from './TranslationHistory';

export class TranslationService {
  constructor(private readonly aiService: AIModelService) {}

  /**
   * 翻译文本
   * @param text 要翻译的文本
   * @param targetLanguage 目标语言
   * @returns 翻译后的文本
   */
  async translate(text: string, targetLanguage: string = 'en'): Promise<string> {
    try {
      // 构建翻译提示
      const prompt = `Translate the following text to ${targetLanguage}:\n${text}`;
      
      // 调用AI服务进行翻译
      const translatedText = await this.aiService.generateContent(prompt, {
        model: 'gpt-4',
        temperature: 0.3,
      });

      // 创建翻译项
      const translationItem: TranslationItem = {
        sourceText: text,
        translatedText,
        elementId: 'single-translation',
        elementType: 'TEXT',
      };

      // 保存到翻译历史
      await TranslationHistory.addTranslationBatch(figma.currentPage, [translationItem]);

      return translatedText;
    } catch (error) {
      console.error('[Translation Service] Translation failed:', error);
      throw new Error(`翻译失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 批量翻译文本
   * @param texts 要翻译的文本数组
   * @param targetLanguage 目标语言
   * @returns 翻译后的文本数组
   */
  async batchTranslate(texts: string[], targetLanguage: string = 'en'): Promise<string[]> {
    try {
      // 构建批量翻译提示
      const prompt = `Translate the following texts to ${targetLanguage}. Keep the same order and return only translated texts:\n${texts.join('\n')}`;
      
      // 调用AI服务进行翻译
      const result = await this.aiService.generateContent(prompt, {
        model: 'gpt-4',
        temperature: 0.3,
      });
      
      // 分割结果为数组
      const translatedTexts = result.split('\n').filter(text => text.trim());
      
      // 创建翻译项数组
      const translationItems: TranslationItem[] = texts.map((text, index) => ({
        sourceText: text,
        translatedText: translatedTexts[index],
        elementId: `batch-translation-${index}`,
        elementType: 'TEXT',
      }));

      // 保存到翻译历史
      await TranslationHistory.addTranslationBatch(figma.currentPage, translationItems);

      return translatedTexts;
    } catch (error) {
      console.error('[Translation Service] Batch translation failed:', error);
      throw new Error(`批量翻译失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 重新生成翻译
   * @param originalText 原始文本
   * @param targetLanguage 目标语言
   * @returns 新的翻译结果
   */
  async regenerateTranslation(originalText: string, targetLanguage: string = 'en'): Promise<string> {
    return this.translate(originalText, targetLanguage);
  }
} 