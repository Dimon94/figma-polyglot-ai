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
        // 根据不同的提供商构建请求体
        const requestBody = {
            model: config.modelName,
            messages: [
                {
                    role: "system",
                    content: "You are a professional translator. Translate the following Chinese text to English. Keep the translation concise and natural. Maintain the original formatting. Only return the translated text, without any explanations or additional content."
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