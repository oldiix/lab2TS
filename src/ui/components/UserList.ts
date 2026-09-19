import type { User } from '../../models/User';
import type { Page } from '../../types';
import { MAX_BORROWED_BOOKS } from '../../types';
import { el } from '../dom';
import { Pagination } from './Pagination';

/** Колбеки списку користувачів. */
export interface UserListHandlers {
  onDelete: (userId: string) => void;
  onPageChange: (page: number) => void;
  onSearch: (query: string) => void;
}

/** Список користувачів із пошуком, лічильником книг і пагінацією. */
export class UserList {
  private readonly handlers: UserListHandlers;
  private readonly container: HTMLDivElement;
  private readonly searchInput: HTMLInputElement;
  private searchTimer: number | undefined;

  public constructor(handlers: UserListHandlers) {
    this.handlers = handlers;
    this.container = el('div');
    this.searchInput = el('input', {
      className: 'form-control form-control-sm',
      type: 'search',
      placeholder: "Пошук за ім'ям, email або ID…",
      attrs: { 'aria-label': 'Пошук користувачів' },
    });

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
          el('h5', { className: 'card-title fw-bold mb-0', text: 'Список Користувачів' }),
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

  public update(page: Page<User>, query: string): void {
    const children: Node[] = [];

    if (page.totalItems === 0) {
      children.push(
        el('p', {
          className: 'text-muted mb-0',
          text:
            query.trim().length > 0
              ? `За запитом «${query}» користувачів не знайдено.`
              : 'Користувачів поки немає — додайте першого через форму вище.',
        }),
      );
    } else {
      children.push(
        el(
          'ul',
          { className: 'list-group list-group-flush' },
          ...page.items.map((user) => this.renderRow(user)),
        ),
      );
      const pagination = Pagination.render(page, this.handlers.onPageChange);
      if (pagination !== null) {
        children.push(pagination);
      }
    }

    this.container.replaceChildren(...children);
  }

  private renderRow(user: User): HTMLLIElement {
    const badgeVariant = user.canBorrow() ? 'text-bg-light' : 'text-bg-danger';

    return el(
      'li',
      {
        className: 'list-group-item d-flex align-items-center gap-2',
        dataset: { userId: user.id },
      },
      el('span', { className: 'me-auto', text: user.getLabel() }),
      el('span', {
        className: `badge ${badgeVariant}`,
        title: 'Позичено книг',
        text: `${user.borrowedCount}/${MAX_BORROWED_BOOKS}`,
      }),
      el('button', {
        className: 'btn btn-outline-danger btn-sm',
        type: 'button',
        text: '✕',
        title: 'Видалити користувача',
        onClick: (): void => this.handlers.onDelete(user.id),
      }),
    );
  }
}
