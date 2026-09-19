import type { UserFormValues } from '../../types';
import { Validation } from '../../utils/validators';
import { el } from '../dom';
import { FormField } from './FormField';

/** Колбек, який отримує вже провалідовані значення форми. */
export type UserSubmitHandler = (values: UserFormValues) => void;

/** Форма додавання користувача бібліотеки. */
export class UserForm {
  private readonly nameField = new FormField("Ім'я", 'text', 'name');
  private readonly emailField = new FormField('Email', 'email', 'email');
  private readonly formEl: HTMLFormElement;
  private readonly onSubmit: UserSubmitHandler;

  public constructor(onSubmit: UserSubmitHandler) {
    this.onSubmit = onSubmit;
    this.formEl = el(
      'form',
      { className: 'needs-validation', attrs: { novalidate: 'true' } },
      this.nameField.wrapper,
      this.emailField.wrapper,
      el('button', {
        className: 'btn btn-success btn-sm',
        type: 'submit',
        text: 'Додати Користувача',
      }),
    );

    this.formEl.addEventListener('submit', (event: SubmitEvent) => {
      event.preventDefault();
      this.handleSubmit();
    });
  }

  public render(): HTMLElement {
    return el(
      'section',
      { className: 'card shadow-sm mb-3' },
      el(
        'div',
        { className: 'card-body' },
        el('h5', { className: 'card-title fw-bold mb-3', text: 'Додати Користувача' }),
        this.formEl,
      ),
    );
  }

  private handleSubmit(): void {
    const values: UserFormValues = {
      name: this.nameField.value,
      email: this.emailField.value,
    };

    const result = Validation.validateUser(values);
    this.nameField.clearError();
    this.emailField.clearError();

    if (!result.valid) {
      if (result.errors.name !== undefined) {
        this.nameField.showError(result.errors.name);
      }
      if (result.errors.email !== undefined) {
        this.emailField.showError(result.errors.email);
      }
      return;
    }

    this.onSubmit(values);
    this.nameField.reset();
    this.emailField.reset();
    this.nameField.focus();
  }
}
