import { STORAGE_KEY, MAX_HISTORY_ITEMS } from '../constants';

export interface HistoryItem {
  id: string;
  timestamp: number;
  result: any;
  image: string | null;
  description: string | null;
}

export const historyService = {
  saveItem(result: any, image: string | null, description: string | null): HistoryItem[] {
    const history = this.getHistory();
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      result,
      image,
      description
    };
    const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  },

  getHistory(): HistoryItem[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  },

  deleteItem(id: string): HistoryItem[] {
    const history = this.getHistory();
    const updatedHistory = history.filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    return updatedHistory;
  },

  clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
  }
};
