/**
 * Спільні типи, enum-и та константи застосунку.
 * Модуль не має залежностей — його можна імпортувати з будь-якого шару.
 */

/** Будь-яка сутність, якою вміє керувати Library<T>, повинна мати рядковий id. */
export interface Identifiable {
  readonly id: string;
}

/** Сутність, яку можна серіалізувати у простий об'єкт для LocalStorage. */
export interface Serializable<TDto> {
  toJSON(): TDto;
}

/** Стан книги. */
export enum BookStatus {
  Available = 'available',
  Borrowed = 'borrowed',
}

/** Тип сповіщення — впливає на колір toast-повідомлення. */
export enum NotificationType {
  Success = 'success',
  Error = 'danger',
  Info = 'info',
  Warning = 'warning',
}

/** «Плоске» представлення книги для LocalStorage. */
export interface BookDto {
  id: string;
  title: string;
  author: string;
  year: number;
  status: BookStatus;
  borrowedBy: string | null;
}

/** «Плоске» представлення користувача для LocalStorage. */
export interface UserDto {
  id: string;
  name: string;
  email: string;
  borrowedBookIds: string[];
}

/** Сира форма додавання книги (до валідації всі поля — рядки). */
export interface BookFormValues {
  title: string;
  author: string;
  year: string;
}

/** Сира форма додавання користувача. */
export interface UserFormValues {
  name: string;
  email: string;
}

/** Результат валідації: мапа «поле → текст помилки». */
export interface ValidationResult<TValues> {
  valid: boolean;
  errors: Partial<Record<keyof TValues, string>>;
}

/** Сторінка результатів для пагінації. */
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/** Максимальна кількість одночасно позичених книг одним користувачем. */
export const MAX_BORROWED_BOOKS = 3;

/** Кількість елементів на сторінці списків. */
export const PAGE_SIZE = 5;

/** Ключі LocalStorage. */
export const STORAGE_KEYS = {
  books: 'library-app:books',
  users: 'library-app:users',
} as const;
