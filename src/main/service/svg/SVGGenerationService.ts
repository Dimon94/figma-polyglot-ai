import { AIModelService } from '../ai/AIModelService';

export interface SVGGenerationOptions {
  // SVG生成的基本配置
  width?: number;
  height?: number;
  style?: string;
  description: string;
}

export interface SVGGenerationResult {
  svgCode: string;
  metadata: {
    generatedAt: Date;
    options: SVGGenerationOptions;
  };
}

/**
 * SVG生成服务
 * 负责处理所有与SVG生成相关的功能
 */
export class SVGGenerationService {
  private aiService: AIModelService;

  constructor(aiService: AIModelService) {
    this.aiService = aiService;
  }

  /**
   * 生成SVG代码
   * @param options SVG生成选项
   * @returns 生成的SVG结果
   */
  async generateSVG(options: SVGGenerationOptions): Promise<SVGGenerationResult> {
    try {
      console.log('[SVG Generator] Starting SVG generation with options:', options);
      
      // 构建AI提示词
      const prompt = this.buildPrompt(options);
      console.log('[SVG Generator] Generated prompt:', prompt);
      
      // 调用AI服务生成SVG
      const settings = this.aiService.getSettings();
      console.log('[SVG Generator] Using AI settings:', settings);
      
      const svgCode = await this.aiService.generateContent(prompt, {
        model: settings.provider,
        temperature: 0.7,
        maxTokens: 2000,
      });
      console.log('[SVG Generator] Received raw SVG code:', svgCode);

      // 验证和清理SVG代码
      console.log('[SVG Generator] Cleaning and validating SVG code');
      const cleanedSvgCode = await this.validateAndCleanSVG(svgCode);
      console.log('[SVG Generator] Final cleaned SVG code:', cleanedSvgCode);

      return {
        svgCode: cleanedSvgCode,
        metadata: {
          generatedAt: new Date(),
          options,
        },
      };
    } catch (error: unknown) {
      console.error('[SVG Generator] Failed to generate SVG:', error);
      throw new Error(`SVG生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 构建AI提示词
   */
  private buildPrompt(options: SVGGenerationOptions): string {
    const styleGuide = options.style || 'modern and minimal';
    const colorScheme = styleGuide.includes('color') ? styleGuide : 'monochrome with modern color palette';
    
    return `You are a professional SVG designer and developer. Your task is to create a high-quality, scalable SVG icon based on the following specifications:

[DESIGN REQUIREMENTS]
Description: ${options.description}
Dimensions: ${options.width || 'auto'} x ${options.height || 'auto'}
Style: ${styleGuide}
Color Scheme: ${colorScheme}

[DESIGN PRINCIPLES]
1. Simplicity: Create clean, minimalist designs
2. Scalability: Ensure the icon looks good at any size
3. Visual Balance: Maintain proper weight distribution
4. Consistency: Use consistent stroke weights and corner radii
5. Accessibility: Ensure good contrast and readability

[TECHNICAL SPECIFICATIONS]
1. SVG Structure:
   - Use semantic element names (rect, circle, path, etc.)
   - Include proper viewBox attribute
   - Set width and height as 100% for responsiveness
   - Use relative units (%, em) for scalability

2. Path Optimization:
   - Minimize number of points and commands
   - Use basic shapes where possible (rect, circle) instead of paths
   - Optimize curves for smooth rendering
   - Round coordinates to 2 decimal places

3. Style Guidelines:
   - Use stroke-width between 1.5 and 2.5 for main elements
   - Apply rounded corners (rx, ry) for modern look
   - Implement proper fill and stroke attributes
   - Use transform for positioning and scaling

4. Code Quality:
   - Group related elements with <g> tags
   - Add minimal but helpful comments
   - Use descriptive IDs and classes
   - Include title and desc tags for accessibility

[OUTPUT REQUIREMENTS]
1. Format: Return ONLY valid SVG code
2. Structure: Start with <?xml> declaration followed by <svg> tag
3. Validation: Ensure W3C SVG 1.1 compliance
4. Optimization: Remove any unnecessary attributes or whitespace

[EXAMPLE STRUCTURE]
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%">
  <title>Icon Title</title>
  <desc>Icon Description</desc>
  <!-- Main icon group -->
  <g id="icon">
    <!-- Add your elements here -->
  </g>
</svg>

Remember: Focus on creating a professional, clean, and efficient SVG that accurately represents the description while following modern icon design principles.`;
  }

  /**
   * 验证和清理SVG代码
   */
  private async validateAndCleanSVG(svgCode: string): Promise<string> {
    try {
      // 1. 基本验证
      if (!svgCode.includes('<svg')) {
        throw new Error('无效的SVG代码：缺少<svg>标签');
      }

      // 2. 清理和规范化
      let cleanedSvg = svgCode
        // 移除注释
        .replace(/<!--[\s\S]*?-->/g, '')
        // 移除空行
        .replace(/^\s*[\r\n]/gm, '')
        // 规范化空格
        .replace(/\s+/g, ' ')
        // 移除多余的空格
        .replace(/>\s+</g, '><')
        .trim();

      // 3. 确保基本属性存在
      if (!cleanedSvg.includes('viewBox')) {
        // 添加默认viewBox
        cleanedSvg = cleanedSvg.replace('<svg', '<svg viewBox="0 0 24 24"');
      }
      
      if (!cleanedSvg.includes('xmlns')) {
        // 添加默认命名空间
        cleanedSvg = cleanedSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      // 4. 优化数值
      cleanedSvg = cleanedSvg.replace(/(\d+\.\d{3,})/g, (match) => {
        return Number(match).toFixed(2);
      });

      // 5. 确保XML声明
      if (!cleanedSvg.startsWith('<?xml')) {
        cleanedSvg = '<?xml version="1.0" encoding="UTF-8"?>\n' + cleanedSvg;
      }

      // 6. 验证SVG结构
      const hasClosingTag = cleanedSvg.includes('</svg>');
      const hasValidStructure = /^<\?xml[^>]*>\s*<svg[\s>][\s\S]*<\/svg>$/.test(cleanedSvg);
      
      if (!hasClosingTag || !hasValidStructure) {
        throw new Error('SVG结构无效：缺少必要的标签或结构不完整');
      }

      return cleanedSvg;
    } catch (error: unknown) {
      console.error('[SVG Generator] SVG validation failed:', error);
      throw new Error(`SVG验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
} 