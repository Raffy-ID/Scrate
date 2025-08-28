import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly languageMap: { [key: string]: string } = {
    'auto': 'Auto-detect', 'en': 'English', 'es': 'Spanish', 'fr': 'French',
    'de': 'German', 'it': 'Italian', 'pt': 'Portuguese', 'nl': 'Dutch',
    'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese (Simplified)',
    'ar': 'Arabic', 'hi': 'Hindi', 'tr': 'Turkish', 'pl': 'Polish'
  };

  constructor() {
    if (!process.env.DEEPL_API_KEY) {
        console.warn("DEEPL_API_KEY environment variable not set for DeepL!");
    }
    if (!process.env.GOOGLE_API_KEY) {
        console.warn("GOOGLE_API_KEY environment variable not set for Google Translate!");
    }
  }

  private async translateWithGoogle(
    text: string,
    sourceLangCode: string,
    targetLangCode: string
  ): Promise<string> {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('Google Translate API key is not configured. Please set the GOOGLE_API_KEY environment variable.');
    }

    const apiUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const body: {
      q: string;
      target: string;
      source?: string;
      format: 'text';
    } = {
      q: text,
      target: targetLangCode,
      format: 'text',
    };

    if (sourceLangCode !== 'auto') {
      body.source = sourceLangCode;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = `Google Translate API Error (${response.status})`;
        if (data?.error?.message) {
          errorMessage += `: ${data.error.message}`;
        }
        throw new Error(errorMessage);
      }

      const translatedText = data?.data?.translations?.[0]?.translatedText;
      if (!translatedText) {
        throw new Error('Translation failed: The Google Translate API returned an invalid response.');
      }

      return translatedText;
    } catch (error) {
      console.error('Google Translate API Error:', error);
       if (error instanceof Error && error.message.startsWith('Google Translate API Error')) {
          throw error;
      }
      throw new Error('Failed to communicate with the Google Translate service. Check your connection or API key.');
    }
  }

  private async translateWithDeepL(
    text: string,
    sourceLangCode: string,
    targetLangCode: string
  ): Promise<string> {
    // Languages unsupported by DeepL Free API
    const unsupportedLangs = ['ar', 'hi']; 
    if (unsupportedLangs.includes(sourceLangCode) || unsupportedLangs.includes(targetLangCode)) {
        throw new Error(`DeepL does not support the selected language (Arabic/Hindi). Please choose another language or provider.`);
    }

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      throw new Error('DeepL API key is not configured. Please set the DEEPL_API_KEY environment variable.');
    }

    const apiUrl = 'https://api-free.deepl.com/v2/translate';
    
    const body: {
        text: string[];
        target_lang: string;
        source_lang?: string;
    } = {
        text: [text],
        target_lang: targetLangCode.toUpperCase(),
    };

    if (sourceLangCode !== 'auto') {
        body.source_lang = sourceLangCode.toUpperCase();
    }
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `DeepL-Auth-Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = `DeepL API Error (${response.status}):`;
        try {
            const errorJson = await response.json();
            errorMessage += ` ${errorJson.message || 'Unknown error.'}`;
        } catch (e) {
            errorMessage += ' Could not parse error response.';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.translations || data.translations.length === 0 || !data.translations[0].text) {
        throw new Error('Translation failed: The DeepL API returned an invalid response.');
      }
      
      return data.translations[0].text;

    } catch (error) {
      console.error('DeepL API Error:', error);
      if (error instanceof Error && error.message.startsWith('DeepL API Error')) {
          throw error;
      }
      throw new Error('Failed to communicate with the DeepL translation service. Check your connection or API key.');
    }
  }

  async translate(
    text: string,
    sourceLangCode: string,
    targetLangCode: string,
    provider: 'deepl' | 'google'
  ): Promise<string> {
    if (!text.trim()) {
      return '';
    }

    if (provider === 'deepl') {
      return this.translateWithDeepL(text, sourceLangCode, targetLangCode);
    } 
    
    return this.translateWithGoogle(text, sourceLangCode, targetLangCode);
  }
}