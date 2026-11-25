/**
 * Sandboxed iframes (online previews, embedded demos) and some privacy modes block Web Storage:
 * merely reading `window.localStorage` throws a SecurityError. MSW creates its cookie store from
 * localStorage when it is imported, so the whole mock API — and every page — failed to start there.
 * In that case only, install an in-memory Storage so the demo runs (data lasts until the page closes).
 */
class MemoryStorage implements Storage {
  #data = new Map<string, string>();
  get length() {
    return this.#data.size;
  }
  clear() {
    this.#data.clear();
  }
  getItem(key: string) {
    return this.#data.get(String(key)) ?? null;
  }
  key(index: number) {
    return [...this.#data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.#data.delete(String(key));
  }
  setItem(key: string, value: string) {
    this.#data.set(String(key), String(value));
  }
}

function isBlocked(name: "localStorage" | "sessionStorage"): boolean {
  try {
    const storage = window[name];
    const probe = "__hamsafar_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return false;
  } catch {
    return true;
  }
}

export function ensureUsableStorage(): void {
  if (typeof window === "undefined") return;
  (["localStorage", "sessionStorage"] as const).forEach((name) => {
    if (!isBlocked(name)) return;
    try {
      Object.defineProperty(window, name, {
        value: new MemoryStorage(),
        configurable: true,
      });
    } catch {
      /* cannot be replaced in this browser — the mock will report the failure */
    }
  });
}
