import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SearchableMessage {
  id: string;
  senderId: string;
  sender?: string;
  content: string;
  text?: string;
  timestamp: Date;
}

export interface SearchableContact {
  id: string;
  name: string;
  username: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  profileImage?: string;
  image?: string;
}

const SEARCH_HISTORY_KEY = 'cruzer:search:history';
const SEARCH_INDEX_KEY = 'cruzer:search:index';

class SearchService {
  private searchIndex: Map<string, (SearchableMessage | SearchableContact)[]> = new Map();
  private recentSearches: (SearchableMessage | SearchableContact)[] = [];

  constructor() {
    this.loadSearchData();
  }

  private async loadSearchData() {
    try {
      const [history, index] = await Promise.all([
        AsyncStorage.getItem(SEARCH_HISTORY_KEY),
        AsyncStorage.getItem(SEARCH_INDEX_KEY),
      ]);
      if (history) this.recentSearches = JSON.parse(history);
      if (index) this.searchIndex = new Map(JSON.parse(index));
    } catch (error) {
      console.error('Error loading search data:', error);
    }
  }

  private async saveSearchData() {
    try {
      await Promise.all([
        AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(this.recentSearches)),
        AsyncStorage.setItem(SEARCH_INDEX_KEY, JSON.stringify(Array.from(this.searchIndex.entries()))),
      ]);
    } catch (error) {
      console.error('Error saving search data:', error);
    }
  }

  searchMessages(query: string): SearchableMessage[] {
    return (this.searchIndex.get('messages') || []).filter((msg: any) =>
      msg.content.toLowerCase().includes(query.toLowerCase())
    ) as SearchableMessage[];
  }

  searchContacts(query: string): SearchableContact[] {
    return (this.searchIndex.get('contacts') || []).filter((contact: any) =>
      contact.name.toLowerCase().includes(query.toLowerCase()) ||
      contact.email.toLowerCase().includes(query.toLowerCase())
    ) as SearchableContact[];
  }

  globalSearch(query: string): {messages: SearchableMessage[], contacts: SearchableContact[]} {
    return {
      messages: this.searchMessages(query),
      contacts: this.searchContacts(query),
    };
  }

  getRecentContacts(limit: number = 5): SearchableContact[] {
    return (this.recentSearches.filter(r => 'email' in r) as SearchableContact[]).slice(0, limit);
  }

  suggestContacts(query: string, limit: number = 5): SearchableContact[] {
    return this.searchContacts(query).slice(0, limit);
  }

  indexMessage(message: SearchableMessage) {
    const messages = this.searchIndex.get('messages') || [];
    messages.push(message);
    this.searchIndex.set('messages', messages);
    this.saveSearchData();
  }

  indexContact(contact: SearchableContact) {
    const contacts = this.searchIndex.get('contacts') || [];
    contacts.push(contact);
    this.searchIndex.set('contacts', contacts);
    this.saveSearchData();
  }

  addToRecentSearches(item: SearchableMessage | SearchableContact) {
    this.recentSearches.unshift(item);
    if (this.recentSearches.length > 20) this.recentSearches.pop();
    this.saveSearchData();
  }

  clearSearchHistory() {
    this.recentSearches = [];
    this.saveSearchData();
  }
}

export const searchService = new SearchService();
