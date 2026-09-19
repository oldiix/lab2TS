import type { BookFormValues } from '../../types';
import { Validation } from '../../utils/validators';
import { el } from '../dom';
import { FormField } from './FormField';

/** Колбек, який отримує вже провалідовані значення форми. */
export type BookSubmitHandler = (values: BookFormValues) => void;

/**
 * Форма додавання книги.
 *
 * Компонент відповідає лише за DOM і відображення помилок; самі правила
 * перевірки живуть у `Validation` і покриті тестами окремо від UI.
 */
export class BookForm {
  private readonly titleField = new FormField('Назва книги', 'text', 'title');
  private readonly authorField = new FormField('Автор', 'text', 'author');
  private readonly yearField = new FormField('Рік видання', 'text', 'year');
  private readonly formEl: HTMLFormElement;
  private readonly onSubmit: BookSubmitHandler;

  public constructor(onSubmit: BookSubmitHandler) {
    this.onSubmit = onSubmit;
    this.formEl = el(
      'form',
      { className: 'needs-validation', attrs: { novalidate: 'true' } },
      this.titleField.wrapper,
      this.authorField.wrapper,
      this.yearField.wrapper,
      el('button', { className: 'btn btn-success btn-sm', type: 'submit', text: 'Додати Книгу' }),
    );

    this.formEl.addEventListener('submit', (event: SubmitEvent) => {
      event.preventDefault();
      this.handleSubmit();
    });
  }

  /** Карточка з формою, готова до монтування. */
  public render(): HTMLElement {
    return el(
      'section',
      { className: 'card shadow-sm mb-3' },
      el(
        'div',
        { className: 'card-body' },
        el('h5', { className: 'card-title fw-bold mb-3', text: 'Додати Книгу' }),
        this.formEl,
      ),
    );
  }

  private handleSubmit(): void {
    const values: BookFormValues = {
      title: this.titleField.value,
      author: this.authorField.value,
      year: this.yearField.value,
    };

    const result = Validation.validateBook(values);
    this.titleField.clearError();
    this.authorField.clearError();
    this.yearField.clearError();

    if (!result.valid) {
      if (result.errors.title !== undefined) {
        this.titleField.showError(result.errors.title);
      }
      if (result.errors.author !== undefined) {
        this.authorField.showError(result.errors.author);
      }
      if (result.errors.year !== undefined) {
        this.yearField.showError(result.errors.year);
      }
      return;
    }

    this.onSubmit(values);
    this.reset();
  }

  private reset(): void {
    this.titleField.reset();
    this.authorField.reset();
    this.yearField.reset();
    this.titleField.focus();
  }
}
