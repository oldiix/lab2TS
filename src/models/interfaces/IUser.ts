import type { Identifiable, Serializable, UserDto } from '../../types';

/**
 * Контракт користувача бібліотеки.
 * Користувач сам стежить за лімітом позичених книг — UI лише запитує canBorrow().
 */
export interface IUser extends Identifiable, Serializable<UserDto> {
  readonly name: string;
  readonly email: string;
  readonly borrowedBookIds: readonly string[];
  readonly borrowedCount: number;

  /** Чи може користувач позичити ще одну книгу (ліміт MAX_BORROWED_BOOKS). */
  canBorrow(): boolean;

  /** Зареєструвати позичену книгу. Повертає false, якщо ліміт вичерпано. */
  addBorrowedBook(bookId: string): boolean;

  /** Зняти книгу зі списку позичених. Повертає false, якщо книги не було. */
  removeBorrowedBook(bookId: string): boolean;

  /** Людиночитний підпис: «id Ім'я (email)». */
  getLabel(): string;

  /** Чи збігається користувач із пошуковим запитом за іменем, email або id. */
  matches(query: string): boolean;
}
