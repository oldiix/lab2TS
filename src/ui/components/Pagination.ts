import type { Page } from '../../types';
import { el } from '../dom';

/** Обробник переходу на сторінку. */
export type PageChangeHandler = (page: number) => void;

/**
 * Пагінація Bootstrap.
 *
 * Показується лише коли сторінок більше однієї. Для довгих списків
 * виводиться «вікно» з кількох номерів навколо поточного, а не всі
 * сторінки поспіль — інакше при 200 записах у DOM летіло б 40 кнопок.
 */
export class Pagination {
  private static readonly WINDOW_SIZE = 5;

  public static render<T>(page: Page<T>, onChange: PageChangeHandler): HTMLElement | null {
    if (page.totalPages <= 1) {
      return null;
    }

    const list = el('ul', { className: 'pagination pagination-sm mb-0' });
    list.append(
      Pagination.item('«', page.page > 1, () => onChange(page.page - 1), false),
      ...Pagination.pageNumbers(page.page, page.totalPages).map((num) =>
        Pagination.item(String(num), true, () => onChange(num), num === page.page),
      ),
      Pagination.item('»', page.page < page.totalPages, () => onChange(page.page + 1), false),
    );

    return el(
      'nav',
      { className: 'd-flex justify-content-between align-items-center mt-3' },
      el('small', {
        className: 'text-muted',
        text: `Сторінка ${page.page} з ${page.totalPages} · всього ${page.totalItems}`,
      }),
      list,
    );
  }

  /** Номери сторінок у «вікні» навколо поточної. */
  private static pageNumbers(current: number, total: number): number[] {
    const half = Math.floor(Pagination.WINDOW_SIZE / 2);
    let start = Math.max(1, current - half);
    const end = Math.min(total, start + Pagination.WINDOW_SIZE - 1);
    start = Math.max(1, end - Pagination.WINDOW_SIZE + 1);

    const pages: number[] = [];
    for (let i = start; i <= end; i += 1) {
      pages.push(i);
    }
    return pages;
  }

  private static item(
    label: string,
    enabled: boolean,
    onClick: () => void,
    active: boolean,
  ): HTMLLIElement {
    const classes = ['page-item'];
    if (!enabled) {
      classes.push('disabled');
    }
    if (active) {
      classes.push('active');
    }

    const link = el('button', {
      className: 'page-link',
      type: 'button',
      text: label,
      onClick: (event: MouseEvent): void => {
        event.preventDefault();
        if (enabled && !active) {
          onClick();
        }
      },
    });

    return el('li', { className: classes.join(' ') }, link);
  }
}
