interface TranslationConfig {
    apiKey: string;
    apiEndpoint: string;
    modelName: string;
    provider: 'openai' | 'deepseek' | 'custom';
    targetLanguage: string; // 目标语言代码，如 'en', 'ja', 'ko' 等
}

/**
 * 检测文本语言
 * @param text 要检测的文本
 * @returns 检测到的语言代码
 */
function detectLanguage(text: string): string {
    // 简单的语言检测逻辑
    if (/[\u4e00-\u9fa5]/.test(text)) return 'zh';
    if (/[\u3040-\u30ff]/.test(text)) return 'ja';
    if (/[\uac00-\ud7af]/.test(text)) return 'ko';
    if (/^[a-zA-Z\s\d.,!?()-]+$/.test(text)) return 'en';
    return 'unknown';
}

/**
 * 调用AI API进行文本翻译
 * @param text 要翻译的文本
 * @param config API配置
 * @returns 翻译后的文本
 */
export async function translateText(
    text: string,
    config: TranslationConfig
): Promise<string> {
    const sourceLanguage = detectLanguage(text);
    
    // 如果源语言和目标语言相同，直接返回原文
    if (sourceLanguage === config.targetLanguage) {
        console.log('[Figma Translator] Source and target languages are the same, skipping translation:', text);
        return text;
    }

    try {
        console.log('[Figma Translator] Translation config:', {
            provider: config.provider,
            modelName: config.modelName,
            apiEndpoint: config.apiEndpoint,
            sourceLanguage,
            targetLanguage: config.targetLanguage
        });

        // 根据不同的提供商构建请求体
        const requestBody = {
            model: config.modelName,
            messages: [
                {
                    role: "system",
                    content: `You are a concise translator from ${sourceLanguage} to ${config.targetLanguage}. Follow these rules strictly:
1. Keep translations CONCISE - aim for similar length as source text
2. Use minimal words while preserving full meaning
3. For UI/UX text:
   - Use standard UI terms
   - Prefer shorter alternatives
   - Example: "点击确认" → "Confirm" (not "Click to confirm")
4. Formatting rules:
   - Keep exact spacing/breaks
   - Preserve all special characters
   - Maintain numbers and units as is
5. Output must be:
   - ${config.targetLanguage} only
   - Similar length to source
   - No explanations
   - No source language characters`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            // DeepSeek 特定参数
            ...(config.provider === 'deepseek' && {
                temperature: 0.3,
                max_tokens: 2000,
                top_p: 0.95,
                stream: false
            })
        };

        console.log('[Figma Translator] Sending request to API:', {
            endpoint: config.apiEndpoint,
            requestBody
        });

        const response = await fetch(config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Figma Translator] API error response:', errorText);
            throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
       

        if (!data.choices?.[0]?.message?.content) {
            console.error('[Figma Translator] Invalid API response format:', data);
            throw new Error('Invalid API response format');
        }

        const translatedText = data.choices[0].message.content.trim();
        

        return translatedText;
    } catch (error: any) {
        console.error('[Figma Translator] Translation error:', error);
        if (error.message.includes('Failed to fetch')) {
            throw new Error(`Failed to connect to ${config.provider} API. Please check your network connection and API endpoint.`);
        }
        throw new Error(error.message || 'Failed to translate text');
    }
} 