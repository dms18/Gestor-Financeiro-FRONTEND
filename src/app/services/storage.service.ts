import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  async setItem(key: string, value: any): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await Preferences.set({ key, value: serialized });
  }

  async getItem(key: string): Promise<any> {
    const { value } = await Preferences.get({ key });
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

  async removeItem(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  async clear(): Promise<void> {
    await Preferences.clear();
  }
}
