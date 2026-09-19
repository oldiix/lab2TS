/**
 * Мінімальний контракт сховища — збігається з Web Storage API.
 * Дозволяє підставити in-memory реалізацію в тестах (де немає window).
 */
export interface StorageDriver {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * Резервне сховище в пам'яті.
 *
 * Потрібне у двох випадках: Node-середовище (юніт-тести) та браузер,
 * де LocalStorage заблокований (приватний режим, вимкнені cookies).
 * Без нього кожен виклик storage падав би винятком.
 */
export class MemoryStorageDriver implements StorageDriver {
  private readonly data = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.data.set(key, value);
  }

  public removeItem(key: string): void {
    this.data.delete(key);
  }

  public clear(): void {
    this.data.clear();
  }
}

/** Чи доступний справжній LocalStorage (може кидати SecurityError). */
function resolveDefaultDriver(): StorageDriver {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const probe = '__storage_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    }
  } catch {
    // LocalStorage недоступний — тихо відкочуємось у пам'ять.
  }
  return new MemoryStorageDriver();
}

/**
 * Типізована обгортка над LocalStorage.
 *
 * `Storage<TDto>` працює з масивом DTO конкретного типу, тож `load()`
 * повертає `TDto[]`, а не `unknown`. Серіалізація/десеріалізація та
 * обробка пошкодженого JSON зосереджені тут, а не розмазані по сервісах.
 */
export class Storage<TDto> {
  private readonly key: string;
  private readonly driver: StorageDriver;

  public constructor(key: string, driver: StorageDriver = resolveDefaultDriver()) {
    this.key = key;
    this.driver = driver;
  }

  /** Зберегти масив DTO. Повертає false, якщо запис не вдався (напр. QuotaExceeded). */
  public save(items: TDto[]): boolean {
    try {
      this.driver.setItem(this.key, JSON.stringify(items));
      return true;
    } catch (error) {
      console.error(`[Storage] Не вдалося зберегти "${this.key}":`, error);
      return false;
    }
  }

  /** Прочитати масив DTO. Пошкоджений JSON не валить застосунок — повертається []. */
  public load(): TDto[] {
    const raw = this.driver.getItem(this.key);
    if (raw === null) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as TDto[]) : [];
    } catch (error) {
      console.error(`[Storage] Пошкоджені дані за ключем "${this.key}":`, error);
      this.remove();
      return [];
    }
  }

  /** Видалити запис цього сховища. */
  public remove(): void {
    this.driver.removeItem(this.key);
  }

  /** Очистити все сховище цілком. */
  public clear(): void {
    this.driver.clear();
  }

  /** Чи є збережені дані під цим ключем. */
  public has(): boolean {
    return this.driver.getItem(this.key) !== null;
  }
}
