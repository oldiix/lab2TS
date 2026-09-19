import BootstrapModal from 'bootstrap/js/dist/modal';
import { el } from '../dom';

/** Налаштування модального вікна підтвердження. */
export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: string;
}

/** Налаштування модального вікна з полем вводу. */
export interface PromptOptions {
  title: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Повертає текст помилки або null, якщо значення валідне. */
  validate?: (value: string) => string | null;
}

/** Каркас модального вікна, зібраний програмно. */
interface ModalShell {
  modalEl: HTMLDivElement;
  body: HTMLDivElement;
  footer: HTMLDivElement;
  instance: BootstrapModal;
  dispose: () => void;
}

/**
 * Обгортка над Bootstrap Modal.
 *
 * Кожен виклик створює власне вікно і повністю прибирає його після
 * закриття (`dispose` + `remove`), щоб у DOM не накопичувались «мертві»
 * модалки після сотні операцій позичання.
 *
 * Методи повертають Promise — виклик читається лінійно, без колбеків:
 * `const id = await Modal.prompt({ title: '…' })`.
 */
export class Modal {
  /** Повідомлення з однією кнопкою — заміна забороненого alert(). */
  public static info(message: string, buttonLabel = 'Зрозуміло!'): Promise<void> {
    return new Promise((resolve) => {
      const shell = Modal.createShell(null, message);
      const okBtn = Modal.button(buttonLabel, 'btn-primary', () => shell.instance.hide());
      shell.footer.append(okBtn);

      shell.modalEl.addEventListener('hidden.bs.modal', () => {
        shell.dispose();
        resolve();
      });
      shell.instance.show();
    });
  }

  /** Підтвердження дії. Резолвиться true лише після натискання «підтвердити». */
  public static confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const shell = Modal.createShell(options.title, options.message);
      let confirmed = false;

      const cancelBtn = Modal.button(options.cancelLabel ?? 'Скасувати', 'btn-secondary', () =>
        shell.instance.hide(),
      );
      const confirmBtn = Modal.button(
        options.confirmLabel ?? 'Підтвердити',
        options.confirmVariant ?? 'btn-primary',
        () => {
          confirmed = true;
          shell.instance.hide();
        },
      );

      shell.footer.append(cancelBtn, confirmBtn);
      shell.modalEl.addEventListener('hidden.bs.modal', () => {
        shell.dispose();
        resolve(confirmed);
      });
      shell.instance.show();
    });
  }

  /** Введення тексту (ID користувача). Резолвиться null, якщо скасовано. */
  public static prompt(options: PromptOptions): Promise<string | null> {
    return new Promise((resolve) => {
      const shell = Modal.createShell(options.title, null);
      let result: string | null = null;

      const input = el('input', {
        className: 'form-control form-control-lg',
        type: 'text',
        placeholder: options.placeholder ?? '',
        attrs: { 'aria-label': options.title },
      });
      const feedback = el('div', { className: 'text-danger small mt-2' });
      shell.body.append(input, feedback);

      const submit = (): void => {
        const value = input.value.trim();
        const error = options.validate ? options.validate(value) : null;
        if (error !== null) {
          input.classList.add('is-invalid');
          feedback.textContent = error;
          input.focus();
          return;
        }
        result = value;
        shell.instance.hide();
      };

      input.addEventListener('input', () => {
        input.classList.remove('is-invalid');
        feedback.textContent = '';
      });
      input.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          submit();
        }
      });

      shell.footer.append(
        Modal.button(options.cancelLabel ?? 'Скасувати', 'btn-secondary', () =>
          shell.instance.hide(),
        ),
        Modal.button(options.confirmLabel ?? 'Зберегти', 'btn-primary', submit),
      );

      shell.modalEl.addEventListener('shown.bs.modal', () => input.focus());
      shell.modalEl.addEventListener('hidden.bs.modal', () => {
        shell.dispose();
        resolve(result);
      });
      shell.instance.show();
    });
  }

  private static createShell(title: string | null, message: string | null): ModalShell {
    const body = el(
      'div',
      { className: 'modal-body' },
      message !== null ? el('p', { className: 'mb-0 fs-6', text: message }) : null,
    );
    const footer = el('div', { className: 'modal-footer' });

    const header =
      title !== null
        ? el(
            'div',
            { className: 'modal-header' },
            el('h5', { className: 'modal-title', text: title }),
            el('button', {
              className: 'btn-close',
              type: 'button',
              attrs: { 'data-bs-dismiss': 'modal', 'aria-label': 'Закрити' },
            }),
          )
        : null;

    const modalEl = el(
      'div',
      { className: 'modal fade', attrs: { tabindex: '-1', 'aria-hidden': 'true' } },
      el(
        'div',
        { className: 'modal-dialog modal-dialog-centered' },
        el('div', { className: 'modal-content' }, header, body, footer),
      ),
    );

    document.body.append(modalEl);
    const instance = new BootstrapModal(modalEl);

    return {
      modalEl,
      body,
      footer,
      instance,
      dispose: (): void => {
        instance.dispose();
        modalEl.remove();
      },
    };
  }

  private static button(label: string, variant: string, onClick: () => void): HTMLButtonElement {
    return el('button', {
      className: `btn ${variant}`,
      type: 'button',
      text: label,
      onClick,
    });
  }
}
