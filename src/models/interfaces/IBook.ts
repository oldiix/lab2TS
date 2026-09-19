import type { BookDto, BookStatus, Identifiable, Serializable } from '../../types';

/**
 * Контракт книги: лише читання властивостей + зміна стану позичання.
 * Інтерфейс потрібен, щоб UI та сервіси залежали від контракту, а не від класу Book.
 */
export interface IBook extends Identifiable, Serializable<BookDto> {
  readonly title: string;
  readonly author: string;
  readonly year: number;
  readonly status: BookStatus;
  readonly borrowedBy: string | null;
  readonly isBorrowed: boolean;

  /** Позначити книгу як позичену вказаним користувачем. */
  borrow(userId: string): void;

  /** Повернути книгу до бібліотеки. */
  giveBack(): void;

  /** Людиночитний підпис: «Назва by Автор (Рік)». */
  getLabel(): string;

  /** Чи збігається книга з пошуковим запитом за назвою або автором. */
  matches(query: string): boolean;
}
