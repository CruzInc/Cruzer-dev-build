
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SmartReply {
  id: string;
  context: string;
  reply: string;
  confidence: number;
}

const AI_CACHE_KEY = 'cruzer:ai:cache';

class AIFeaturesService {
  private cache: Map<string, SmartReply[]> = new Map();

  constructor() {
    this.loadCache();
  }

  private async loadCache() {
    try {
      const cached = await AsyncStorage.getItem(AI_CACHE_KEY);
      if (cached) this.cache = new Map(JSON.parse(cached));
    } catch (error) {
      console.error('Error loading AI cache:', error);
    }
  }

  private async saveCache() {
    try {
      await AsyncStorage.setItem(AI_CACHE_KEY, JSON.stringify(Array.from(this.cache.entries())));
    } catch (error) {
      console.error('Error saving AI cache:', error);
    }
  }

  generateSmartReplies(context: string): SmartReply[] {
    const replies: SmartReply[] = [
      { id: '1', context, reply: 'Sounds good!', confidence: 0.9 },
      { id: '2', context, reply: 'Let me get back to you', confidence: 0.8 },
      { id: '3', context, reply: 'Thanks for letting me know', confidence: 0.85 },
    ];
    this.cache.set(context, replies);
    this.saveCache();
    return replies;
  }

  predictNextMessage(conversationHistory: string[]): string {
    return conversationHistory.length > 0 ? 'That sounds great!' : '';
  }

  translateMessage(message: string, targetLanguage: string): Promise<string> {
    return fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(message)}&langpair=en|${targetLanguage}`)
      .then(r => r.json())
      .then(data => data.responseData?.translatedText || message)
      .catch(() => message);
  }

  detectLanguage(text: string): string {
    const languages: { [key: string]: string[] } = {
      en: ['hello', 'world', 'the', 'is'],
      es: ['hola', 'mundo', 'el', 'es'],
      fr: ['bonjour', 'monde', 'le', 'est'],
      de: ['hallo', 'welt', 'der', 'ist'],
      it: ['ciao', 'mondo', 'il', 'è'],
    };
    for (const [lang, words] of Object.entries(languages)) {
      if (words.some(w => text.toLowerCase().includes(w))) return lang;
    }
    return 'en';
  }
}

export const aiFeatureService = new AIFeaturesService();
