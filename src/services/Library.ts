import type { Identifiable, Page } from '../types';

/** Предикат пошуку в колекції. */
export type Predicate<T> = (item: T, index: number) => boolean;

/** Компаратор сортування. */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * Узагальнена (generic) колекція сутностей бібліотеки.
 *
 * `T extends Identifiable` — єдине обмеження: у сутності має бути рядковий id.
 * Завдяки цьому один і той самий клас керує і книгами (`Library<Book>`),
 * і користувачами (`Library<User>`) без дублювання коду й без втрати типізації:
 * `books.findById(id)` повертає `Book | undefined`, а не `object`.
 *
 * Всередині — Map замість масиву: add/remove/findById працюють за O(1),
 * тоді як масив дає O(n) на кожну операцію за id. На списках у кілька тисяч
 * записів та частих ре-рендерах різниця вже відчутна.
 * Map зберігає порядок вставки, тому порядок виводу лишається передбачуваним.
 */
export class Library<T extends Identifiable> {
  private readonly items: Map<string, T>;

  public constructor(initialItems: T[] = []) {
    this.items = new Map(initialItems.map((item) => [item.id, item]));
  }

  /** Кількість елементів у колекції. */
  public get size(): number {
    return this.items.size;
  }

  /** Чи колекція порожня. */
  public get isEmpty(): boolean {
    return this.items.size === 0;
  }

  /**
   * Додати елемент. Повертає false, якщо елемент з таким id вже існує
   * (щоб виклик не «мовчки» перезаписав існуючий запис).
   */
  public add(item: T): boolean {
    if (this.items.has(item.id)) {
      return false;
    }
    this.items.set(item.id, item);
    return true;
  }

  /** Додати кілька елементів; повертає кількість фактично доданих. */
  public addMany(items: T[]): number {
    let added = 0;
    for (const item of items) {
      if (this.add(item)) {
        added += 1;
      }
    }
    return added;
  }

  /** Видалити елемент за id. Повертає false, якщо такого id не було. */
  public remove(id: string): boolean {
    return this.items.delete(id);
  }

  /** Знайти елемент за id. */
  public findById(id: string): T | undefined {
    return this.items.get(id);
  }

  /** Чи є в колекції елемент із таким id. */
  public has(id: string): boolean {
    return this.items.has(id);
  }

  /** Перший елемент, що задовольняє предикат. */
  public find(predicate: Predicate<T>): T | undefined {
    let index = 0;
    for (const item of this.items.values()) {
      if (predicate(item, index)) {
        return item;
      }
      index += 1;
    }
    return undefined;
  }

  /** Усі елементи, що задовольняють предикат. */
  public filter(predicate: Predicate<T>): T[] {
    const result: T[] = [];
    let index = 0;
    for (const item of this.items.values()) {
      if (predicate(item, index)) {
        result.push(item);
      }
      index += 1;
    }
    return result;
  }

  /** Копія колекції у вигляді масиву (у порядку додавання). */
  public getAll(): T[] {
    return Array.from(this.items.values());
  }

  /** Відсортована копія колекції; оригінальний порядок не змінюється. */
  public getSorted(comparator: Comparator<T>): T[] {
    return this.getAll().sort(comparator);
  }

  /**
   * Замінити існуючий елемент новим екземпляром із тим самим id.
   * Повертає false, якщо елемента не було.
   */
  public update(item: T): boolean {
    if (!this.items.has(item.id)) {
      return false;
    }
    this.items.set(item.id, item);
    return true;
  }

  /** Очистити колекцію. */
  public clear(): void {
    this.items.clear();
  }

  /** Перетворити елементи на інший тип (наприклад, у DTO для LocalStorage). */
  public map<R>(mapper: (item: T) => R): R[] {
    return this.getAll().map(mapper);
  }

  /**
   * Сторінка результатів.
   *
   * Джерело даних можна передати ззовні (наприклад, уже відфільтрований
   * пошуком масив), щоб не проганяти фільтр двічі.
   */
  public paginate(page: number, pageSize: number, source?: T[]): Page<T> {
    const items = source ?? this.getAll();
    const totalItems = items.length;
    const safePageSize = Math.max(1, pageSize);
    const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
    const safePage = Math.min(Math.max(1, Math.trunc(page)), totalPages);
    const start = (safePage - 1) * safePageSize;

    return {
      items: items.slice(start, start + safePageSize),
      page: safePage,
      pageSize: safePageSize,
      totalItems,
      totalPages,
    };
  }

  /** Ітерування колекції в for…of без викликів getAll(). */
  public [Symbol.iterator](): IterableIterator<T> {
    return this.items.values();
  }
}
