import type { BookFormValues, UserFormValues, ValidationResult } from '../types';

/**
 * Простір імен Validation.
 *
 * namespace всередині модуля використано свідомо: він логічно групує
 * регулярні вирази, повідомлення та функції перевірки під одним іменем
 * (`Validation.isValidYear(...)`), не засмічуючи простір імен імпортів
 * десятком дрібних експортів.
 */
export namespace Validation {
  /** Мінімально допустимий рік видання (перші друковані книги). */
  export const MIN_YEAR = 1450;

  /** Тексти помилок в одному місці — щоб UI не дублював рядки. */
  export const MESSAGES = {
    required: "Це поле є обов'язковим",
    digitsOnly: 'Поле має містити тільки цифри',
    yearFormat: 'Рік видання має складатися з 4 цифр',
    yearRange: `Рік видання має бути в межах ${MIN_YEAR}—${new Date().getFullYear()}`,
    email: 'Введіть коректний email',
    nameLength: "Ім'я має містити щонайменше 2 символи",
    titleLength: 'Назва має містити щонайменше 2 символи',
    authorLength: 'Автор має містити щонайменше 2 символи',
  } as const;

  /** Тільки цифри — для id користувача. */
  export const DIGITS_ONLY = /^\d+$/;

  /** Рік: рівно 4 цифри, від 1000 до 2199. */
  export const YEAR_PATTERN = /^(1\d{3}|20\d{2}|21\d{2})$/;

  /** Спрощена, але практична перевірка email. */
  export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

  /** Поле заповнене (не порожнє й не самі пробіли). */
  export function isRequired(value: string | null | undefined): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /** Рядок складається тільки з цифр — використовується для id користувача. */
  export function isDigitsOnly(value: string): boolean {
    return DIGITS_ONLY.test(value.trim());
  }

  /** Валідний id користувача: обов'язковий та тільки з цифр. */
  export function isValidUserId(value: string): boolean {
    return isRequired(value) && isDigitsOnly(value);
  }

  /**
   * Валідний рік видання: 4 цифри за регуляркою і не з майбутнього.
   * Регулярка відсікає формат, діапазон — семантику.
   */
  export function isValidYear(value: string): boolean {
    const trimmed = value.trim();
    if (!YEAR_PATTERN.test(trimmed)) {
      return false;
    }
    const year = Number(trimmed);
    return year >= MIN_YEAR && year <= new Date().getFullYear();
  }

  /** Валідний email. */
  export function isValidEmail(value: string): boolean {
    return EMAIL_PATTERN.test(value.trim());
  }

  /** Мінімальна довжина після обрізання пробілів. */
  export function hasMinLength(value: string, min: number): boolean {
    return value.trim().length >= min;
  }

  /** Повна валідація форми книги. */
  export function validateBook(values: BookFormValues): ValidationResult<BookFormValues> {
    const errors: ValidationResult<BookFormValues>['errors'] = {};

    if (!isRequired(values.title)) {
      errors.title = MESSAGES.required;
    } else if (!hasMinLength(values.title, 2)) {
      errors.title = MESSAGES.titleLength;
    }

    if (!isRequired(values.author)) {
      errors.author = MESSAGES.required;
    } else if (!hasMinLength(values.author, 2)) {
      errors.author = MESSAGES.authorLength;
    }

    if (!isRequired(values.year)) {
      errors.year = MESSAGES.required;
    } else if (!isDigitsOnly(values.year)) {
      errors.year = MESSAGES.digitsOnly;
    } else if (!YEAR_PATTERN.test(values.year.trim())) {
      errors.year = MESSAGES.yearFormat;
    } else if (!isValidYear(values.year)) {
      errors.year = MESSAGES.yearRange;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  /** Повна валідація форми користувача. */
  export function validateUser(values: UserFormValues): ValidationResult<UserFormValues> {
    const errors: ValidationResult<UserFormValues>['errors'] = {};

    if (!isRequired(values.name)) {
      errors.name = MESSAGES.required;
    } else if (!hasMinLength(values.name, 2)) {
      errors.name = MESSAGES.nameLength;
    }

    if (!isRequired(values.email)) {
      errors.email = MESSAGES.required;
    } else if (!isValidEmail(values.email)) {
      errors.email = MESSAGES.email;
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  /** Валідація поля «ID користувача» в модальному вікні позичання. */
  export function validateUserIdInput(value: string): string | null {
    if (!isRequired(value)) {
      return MESSAGES.required;
    }
    if (!isDigitsOnly(value)) {
      return MESSAGES.digitsOnly;
    }
    return null;
  }
}
