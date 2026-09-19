import type { Book } from '../../models/Book';
import type { Page } from '../../types';
import { el } from '../dom';
import { Pagination } from './Pagination';

/** Набір колбеків, які список пробрасує наверх. */
export interface BookListHandlers {
  onBorrow: (bookId: string) => void;
  onReturn: (bookId: string) => void;
  onDelete: (bookId: string) => void;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
}

/**
 * Список книг із пошуком і пагінацією.
 *
 * Компонент не тримає стан — він отримує готову сторінку від рендерера
 * і лише перемальовує свій контейнер. Перемальовується лише внутрішній
 * блок картки, а не весь застосунок.
 */
export class BookList {
  private readonly handlers: BookListHandlers;
  private readonly container: HTMLDivElement;
  private readonly searchInput: HTMLInputElement;
  private searchTimer: number | undefined;

  public constructor(handlers: BookListHandlers) {
    this.handlers = handlers;
    this.container = el('div');
    this.searchInput = el('input', {
      className: 'form-control form-control-sm',
      type: 'search',
      placeholder: 'Пошук за назвою або автором…',
      attrs: { 'aria-label': 'Пошук книг' },
    });

    // Debounce: без нього кожне натискання клавіші перебудовує список.
    this.searchInput.addEventListener('input', () => {
      window.clearTimeout(this.searchTimer);
      this.searchTimer = window.setTimeout(() => {
        this.handlers.onSearch(this.searchInput.value);
      }, 200);
    });
  }

  public render(): HTMLElement {
    return el(
      'section',
      { className: 'card shadow-sm mb-3' },
      el(
        'div',
        { className: 'card-body' },
        el(
          'div',
          { className: 'd-flex justify-content-between align-items-center gap-3 mb-3' },
          el('h5', { className: 'card-title fw-bold mb-0', text: 'Список Книг' }),
          el(
            'div',
            { className: 'flex-grow-1', attrs: { style: 'max-width: 320px' } },
            this.searchInput,
          ),
        ),
        this.container,
      ),
    );
  }

  /** Перемалювати список за поточною сторінкою. */
  public update(page: Page<Book>, query: string): void {
    const children: Node[] = [];

    if (page.totalItems === 0) {
      children.push(
        el('p', {
          className: 'text-muted mb-0',
          text:
            query.trim().length > 0
              ? `За запитом «${query}» книг не знайдено.`
              : 'Книг поки немає — додайте першу через форму вище.',
        }),
      );
    } else {
      children.push(
        el(
          'ul',
          { className: 'list-group list-group-flush' },
          ...page.items.map((book) => this.renderRow(book)),
        ),
      );
      const pagination = Pagination.render(page, this.handlers.onPageChange);
      if (pagination !== null) {
        children.push(pagination);
      }
    }

    this.container.replaceChildren(...children);
  }

  private renderRow(book: Book): HTMLLIElement {
    const actionBtn = book.isBorrowed
      ? el('button', {
          className: 'btn btn-warning btn-sm',
          type: 'button',
          text: 'Повернути',
          onClick: (): void => this.handlers.onReturn(book.id),
        })
      : el('button', {
          className: 'btn btn-primary btn-sm',
          type: 'button',
          text: 'Позичити',
          onClick: (): void => this.handlers.onBorrow(book.id),
        });

    const deleteBtn = el('button', {
      className: 'btn btn-outline-danger btn-sm',
      type: 'button',
      text: '✕',
      title: 'Видалити книгу',
      onClick: (): void => this.handlers.onDelete(book.id),
    });

    const label = el(
      'div',
      { className: 'me-auto' },
      el('span', { text: book.getLabel() }),
      book.isBorrowed
        ? el('span', {
            className: 'badge text-bg-secondary ms-2',
            text: `у ${book.borrowedBy ?? '—'}`,
          })
        : null,
    );

    return el(
      'li',
      {
        className: 'list-group-item d-flex align-items-center gap-2',
        dataset: { bookId: book.id },
      },
      label,
      actionBtn,
      deleteBtn,
    );
  }
}
