import { el } from '../dom';

/**
 * Поле форми: input + місце під текст помилки.
 *
 * Винесено окремо, бо BookForm і UserForm відрізняються лише набором
 * полів — уся логіка показу/приховування помилок спільна.
 */
export class FormField {
  public readonly wrapper: HTMLDivElement;
  public readonly input: HTMLInputElement;
  private readonly errorEl: HTMLDivElement;

  public constructor(placeholder: string, type = 'text', name = '') {
    this.input = el('input', {
      className: 'form-control',
      type,
      placeholder,
      attrs: { 'aria-label': placeholder, name },
    });
    this.errorEl = el('div', { className: 'text-danger small mt-1 d-none' });
    this.wrapper = el('div', { className: 'mb-2' }, this.input, this.errorEl);

    // Помилка зникає, щойно користувач почав виправляти значення.
    this.input.addEventListener('input', () => this.clearError());
  }

  public get value(): string {
    return this.input.value;
  }

  public set value(next: string) {
    this.input.value = next;
  }

  public showError(message: string): void {
    this.input.classList.add('is-invalid');
    this.errorEl.textContent = message;
    this.errorEl.classList.remove('d-none');
  }

  public clearError(): void {
    this.input.classList.remove('is-invalid');
    this.errorEl.textContent = '';
    this.errorEl.classList.add('d-none');
  }

  public reset(): void {
    this.input.value = '';
    this.clearError();
  }

  public focus(): void {
    this.input.focus();
  }
}
