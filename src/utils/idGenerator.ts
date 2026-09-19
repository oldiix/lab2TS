/**
 * Генерація ідентифікаторів.
 *
 * За умовою лабораторної id користувача має складатися ТІЛЬКИ з цифр,
 * тому використовується timestamp + лічильник, а не uuid.
 */

let sequence = 0;

/**
 * Числовий id (рядок із самих цифр) — для користувачів.
 * Лічильник гарантує унікальність навіть при кількох викликах в одну мілісекунду.
 */
export function generateNumericId(): string {
  sequence = (sequence + 1) % 1000;
  return `${Date.now()}${sequence.toString().padStart(3, '0')}`;
}

/**
 * Префіксований id — для книг (читабельніше в LocalStorage і в DOM-атрибутах).
 */
export function generateId(prefix = 'id'): string {
  sequence = (sequence + 1) % 1000;
  return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`;
}
