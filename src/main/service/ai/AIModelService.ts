import { SettingsService } from '../settings/SettingsService';

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

  constructor() {
    this.settingsService = SettingsService.getInstance();
  }

  /**
   * 生成内容
   * @param prompt 提示词
   * @param config 模型配置
   * @returns 生成的内容
   */
  async generateContent(prompt: string, config: AIModelConfig): Promise<string> {
    try {
      const response = await fetch(this.settingsService.getApiEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settingsService.getApiKey()}`,
        },
        body: JSON.stringify({
          model: this.getModelIdentifier(config.model),
          messages: [
            {
              role: 'system',
              content: `You are a professional SVG designer and developer with expertise in:
1. Icon Design: Creating clean, modern, and visually appealing icons
2. SVG Development: Writing optimized, standards-compliant SVG code
3. Vector Graphics: Understanding paths, shapes, and transformations
4. Design Principles: Applying composition, balance, and visual hierarchy
5. Technical Standards: Following W3C SVG specifications

Your task is to generate SVG code that is:
- Semantically structured
- Optimized for performance
- Visually balanced and appealing
- Accessible and scalable
- Standards-compliant

Output only valid SVG code without any explanation or markdown formatting.`,
            },
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
        throw new Error(`API请求失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error: unknown) {
      const apiError = error as APIError;
      console.error('AI内容生成失败:', apiError);
      throw new Error(`AI内容生成失败: ${apiError.message}`);
    }
  }

  /**
   * 获取模型标识符
   */
  private getModelIdentifier(model: string): string {
    const modelMap: Record<string, string> = {
      'openai': 'gpt-4',
      'deepseek': 'deepseek-chat',
      'custom': model // 对于自定义模型，直接使用传入的模型名称
    };

    return modelMap[model] || model;
  }

  /**
   * 获取当前AI设置
   */
  getSettings() {
    return this.settingsService.getCurrentSettings();
  }
} 