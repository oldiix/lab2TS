import type { UserDto } from '../types';
import { MAX_BORROWED_BOOKS } from '../types';
import type { IUser } from './interfaces/IUser';

/**
 * Модель користувача бібліотеки.
 *
 * Список позичених книг зберігається як Set — O(1) на перевірку/видалення
 * замість O(n) для масиву, що помітно на великій кількості операцій.
 */
export class User implements IUser {
  private readonly _id: string;
  private readonly _name: string;
  private readonly _email: string;
  private readonly _borrowedBookIds: Set<string>;

  public constructor(id: string, name: string, email: string, borrowedBookIds: string[] = []) {
    this._id = id;
    this._name = name.trim();
    this._email = email.trim().toLowerCase();
    this._borrowedBookIds = new Set(borrowedBookIds);
  }

  public get id(): string {
    return this._id;
  }

  public get name(): string {
    return this._name;
  }

  public get email(): string {
    return this._email;
  }

  public get borrowedBookIds(): readonly string[] {
    return Array.from(this._borrowedBookIds);
  }

  public get borrowedCount(): number {
    return this._borrowedBookIds.size;
  }

  public canBorrow(): boolean {
    return this._borrowedBookIds.size < MAX_BORROWED_BOOKS;
  }

  public addBorrowedBook(bookId: string): boolean {
    if (!this.canBorrow() || this._borrowedBookIds.has(bookId)) {
      return false;
    }
    this._borrowedBookIds.add(bookId);
    return true;
  }

  public removeBorrowedBook(bookId: string): boolean {
    return this._borrowedBookIds.delete(bookId);
  }

  public getLabel(): string {
    return `${this._id} ${this._name} (${this._email})`;
  }

  public matches(query: string): boolean {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) {
      return true;
    }
    return (
      this._name.toLowerCase().includes(needle) ||
      this._email.includes(needle) ||
      this._id.includes(needle)
    );
  }

  public toJSON(): UserDto {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      borrowedBookIds: Array.from(this._borrowedBookIds),
    };
  }

  /** Відновлення користувача з даних LocalStorage. */
  public static fromJSON(dto: UserDto): User {
    return new User(dto.id, dto.name, dto.email, dto.borrowedBookIds);
  }
}
