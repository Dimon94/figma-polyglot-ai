import { SettingsService, AISettings } from '../settings/SettingsService';

interface AIModelConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

interface APIError extends Error {
  statusText?: string;
}

/**
 * AI模型服务
 * 负责处理与不同AI模型的交互
 */
export class AIModelService {
  private settingsService: SettingsService;
  private currentSettings: AISettings;

  constructor() {
    this.settingsService = SettingsService.getInstance();
    this.currentSettings = this.settingsService.getCurrentSettings();
  }

  /**
   * 更新设置
   */
  updateSettings(settings: AISettings): void {
    console.log('[AIModelService] Updating settings:', settings);
    this.currentSettings = settings;
  }

  /**
   * 生成内容
   * @param prompt 提示词
   * @param config 模型配置
   * @returns 生成的内容
   */
  async generateContent(prompt: string, config: AIModelConfig): Promise<string> {
    try {
      console.log('[AIModelService] Generating content with settings:', this.currentSettings);
      console.log('[AIModelService] Prompt:', prompt);
      console.log('[AIModelService] Config:', config);

      const response = await fetch(this.currentSettings.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.currentSettings.apiKey}`,
        },
        body: JSON.stringify({
          model: this.getModelIdentifier(config.model),
          messages: [
            this.buildSystemPrompt(),
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[AIModelService] API response error:', response.status, errorText);
        throw new Error(`API请求失败: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const data = await response.json();
      console.log('[AIModelService] API response:', data);
      return data.choices[0].message.content.trim();
    } catch (error: unknown) {
      const apiError = error as APIError;
      console.error('[AIModelService] Content generation failed:', apiError);
      throw new Error(`AI内容生成失败: ${apiError.message}`);
    }
  }

  /**
   * 获取模型标识符
   */
  private getModelIdentifier(model: string): string {
    console.log('[AIModelService] Getting model identifier for:', model);
    console.log('[AIModelService] Current settings:', this.currentSettings);
    
    // 如果设置中有指定的模型名称，优先使用
    if (this.currentSettings.modelName) {
      return this.currentSettings.modelName;
    }

    // 否则根据提供商选择默认模型
    const modelMap: Record<string, string> = {
      'openai': 'gpt-4',
      'deepseek': 'deepseek-chat',
      'custom': model
    };

    const selectedModel = modelMap[this.currentSettings.provider] || model;
    console.log('[AIModelService] Selected model:', selectedModel);
    return selectedModel;
  }

  /**
   * 获取当前AI设置
   */
  getSettings(): AISettings {
    return this.currentSettings;
  }

  private buildSystemPrompt(): { role: string; content: string } {
    return {
      role: 'system',
      content: `You are a professional translator with expertise in:
1. Language Translation: Accurate and contextual translations
2. UX Writing: Creating user-friendly interface text
3. Brand Voice: Maintaining consistent tone and style

Please translate the given text while:
- Maintaining the original meaning and context
- Preserving formatting and special characters
- Keeping proper nouns unchanged unless translation is specifically requested
- Using appropriate terminology for the target language

Respond with the translated text only, without explanations or notes.`
    };
  }
} 