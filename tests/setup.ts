// Test environment setup for Node.js test runner

class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get length(): number {
    return this.store.size;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] || null;
  }
}

if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.setItem) {
  // @ts-ignore
  globalThis.localStorage = new MockLocalStorage();
}

export function resetTestStorage(): void {
  globalThis.localStorage.clear();
}
