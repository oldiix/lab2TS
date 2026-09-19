import BootstrapToast from 'bootstrap/js/dist/toast';
import { NotificationType } from '../../types';
import { el } from '../dom';

/**
 * Контейнер toast-повідомлень.
 *
 * Контейнер створюється один раз (lazy) і перевикористовується — інакше
 * кожне повідомлення додавало б у body новий фіксований блок.
 * Сам toast після приховування знищується разом із Bootstrap-екземпляром,
 * щоб не тримати слухачі подій на елементах, яких уже не видно.
 */
export class ToastContainer {
  private static container: HTMLDivElement | null = null;

  public static show(message: string, type: NotificationType = NotificationType.Info): void {
    const container = ToastContainer.getContainer();

    const toastEl = el(
      'div',
      {
        className: `toast align-items-center text-bg-${type} border-0`,
        attrs: { role: 'alert', 'aria-live': 'assertive', 'aria-atomic': 'true' },
      },
      el(
        'div',
        { className: 'd-flex' },
        el('div', { className: 'toast-body', text: message }),
        el('button', {
          className: 'btn-close btn-close-white me-2 m-auto',
          type: 'button',
          attrs: { 'data-bs-dismiss': 'toast', 'aria-label': 'Закрити' },
        }),
      ),
    );

    container.append(toastEl);

    const toast = new BootstrapToast(toastEl, { delay: 4000 });
    toastEl.addEventListener('hidden.bs.toast', () => {
      toast.dispose();
      toastEl.remove();
    });
    toast.show();
  }

  private static getContainer(): HTMLDivElement {
    if (ToastContainer.container === null || !ToastContainer.container.isConnected) {
      const container = el('div', {
        className: 'toast-container position-fixed bottom-0 end-0 p-3',
      });
      container.style.zIndex = '1100';
      document.body.append(container);
      ToastContainer.container = container;
    }
    return ToastContainer.container;
  }
}
