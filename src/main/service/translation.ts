interface TranslationConfig {
    apiKey: string;
    apiEndpoint: string;
    modelName: string;
    provider: 'openai' | 'deepseek' | 'custom';
}

/**
 * 检测文本是否包含中文字符
 * @param text 要检测的文本
 * @returns 是否包含中文
 */
function containsChinese(text: string): boolean {
    return /[\u4e00-\u9fa5]/.test(text);
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
    // 如果不包含中文，直接返回原文
    if (!containsChinese(text)) {
        console.log('[Figma Translator] Text does not contain Chinese, skipping translation:', text);
        return text;
    }

    try {
        console.log('[Figma Translator] Translation config:', {
            provider: config.provider,
            modelName: config.modelName,
            apiEndpoint: config.apiEndpoint
        });

        // 根据不同的提供商构建请求体
        const requestBody = {
            model: config.modelName,
            messages: [
                {
                    role: "system",
                    content: `You are a professional translator specializing in Chinese to English translation. Follow these guidelines:
1. ALWAYS maintain the original text's tone and style
2. Keep formatting elements (spaces, line breaks) exactly as they appear
3. For UI/UX text:
   - Use standard English UI terminology
   - Keep translations concise and clear
   - Maintain consistent capitalization
4. For design-related content:
   - Preserve technical terms in their standard English form
   - Maintain any numerical values and units as is
5. Output rules:
   - Return ONLY the translated text
   - NO explanations or additional content
   - NO Chinese characters in output
   - Preserve all special characters and punctuation`
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