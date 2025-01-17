export interface AISettings {
  apiKey: string;
  apiEndpoint: string;
  modelName: string;
  provider: 'openai' | 'deepseek' | 'custom';
}

export const DEFAULT_SETTINGS: AISettings = {
  apiKey: '',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  modelName: 'gpt-3.5-turbo',
  provider: 'openai'
};

/**
 * 设置管理服务
 * 负责处理所有与设置相关的操作
 */
export class SettingsService {
  private static instance: SettingsService;
  private currentSettings: AISettings = DEFAULT_SETTINGS;

  private constructor() {
    this.loadSettings().catch(error => {
      console.error('初始化加载设置失败:', error);
    });
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * 加载设置
   */
  public async loadSettings(): Promise<AISettings> {
    try {
      const settings = await figma.clientStorage.getAsync('settings');
      if (settings) {
        this.currentSettings = settings;
        console.log('[SettingsService] Loaded settings:', settings);
      } else {
        console.log('[SettingsService] No saved settings found, using defaults');
      }
      return this.currentSettings;
    } catch (error) {
      console.error('[SettingsService] Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * 保存设置
   */
  public async saveSettings(settings: AISettings): Promise<void> {
    try {
      await figma.clientStorage.setAsync('settings', settings);
      this.currentSettings = settings;
    } catch (error) {
      console.error('保存设置失败:', error);
      throw new Error('保存设置失败');
    }
  }

  /**
   * 获取当前设置
   */
  public getCurrentSettings(): AISettings {
    return this.currentSettings;
  }

  /**
   * 获取API密钥
   */
  public getApiKey(): string {
    return this.currentSettings.apiKey;
  }

  /**
   * 获取API端点
   */
  public getApiEndpoint(): string {
    return this.currentSettings.apiEndpoint;
  }

  /**
   * 获取模型名称
   */
  public getModelName(): string {
    return this.currentSettings.modelName;
  }

  /**
   * 获取服务提供商
   */
  public getProvider(): 'openai' | 'deepseek' | 'custom' {
    return this.currentSettings.provider;
  }
} 