import type { BookDto } from '../types';
import { BookStatus } from '../types';
import type { IBook } from './interfaces/IBook';

/**
 * Модель книги.
 *
 * Клас нічого не знає ні про DOM, ні про LocalStorage — лише дані та власний стан.
 * Поля приватні, доступ — через геттери, зміна стану — через borrow()/giveBack().
 */
export class Book implements IBook {
  private readonly _id: string;
  private readonly _title: string;
  private readonly _author: string;
  private readonly _year: number;
  private _status: BookStatus;
  private _borrowedBy: string | null;

  public constructor(
    id: string,
    title: string,
    author: string,
    year: number,
    status: BookStatus = BookStatus.Available,
    borrowedBy: string | null = null,
  ) {
    this._id = id;
    this._title = title.trim();
    this._author = author.trim();
    this._year = year;
    this._status = status;
    this._borrowedBy = borrowedBy;
  }

  public get id(): string {
    return this._id;
  }

  public get title(): string {
    return this._title;
  }

  public get author(): string {
    return this._author;
  }

  public get year(): number {
    return this._year;
  }

  public get status(): BookStatus {
    return this._status;
  }

  public get borrowedBy(): string | null {
    return this._borrowedBy;
  }

  public get isBorrowed(): boolean {
    return this._status === BookStatus.Borrowed;
  }

  public borrow(userId: string): void {
    if (this.isBorrowed) {
      throw new Error(`Книга "${this._title}" вже позичена.`);
    }
    this._status = BookStatus.Borrowed;
    this._borrowedBy = userId;
  }

  public giveBack(): void {
    if (!this.isBorrowed) {
      throw new Error(`Книга "${this._title}" не була позичена.`);
    }
    this._status = BookStatus.Available;
    this._borrowedBy = null;
  }

  public getLabel(): string {
    return `${this._title} by ${this._author} (${this._year})`;
  }

  public matches(query: string): boolean {
    const needle = query.trim().toLowerCase();
    if (needle.length === 0) {
      return true;
    }
    return (
      this._title.toLowerCase().includes(needle) || this._author.toLowerCase().includes(needle)
    );
  }

  public toJSON(): BookDto {
    return {
      id: this._id,
      title: this._title,
      author: this._author,
      year: this._year,
      status: this._status,
      borrowedBy: this._borrowedBy,
    };
  }

  /** Відновлення книги з даних LocalStorage. */
  public static fromJSON(dto: BookDto): Book {
    return new Book(dto.id, dto.title, dto.author, dto.year, dto.status, dto.borrowedBy);
  }
}
