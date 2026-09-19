import { NotificationType } from '../types';
import type { ConfirmOptions, PromptOptions } from '../ui/components/Modal';
import { Modal } from '../ui/components/Modal';
import { ToastContainer } from '../ui/components/Toast';

/**
 * Єдина точка входу для всіх повідомлень користувачу.
 *
 * `alert` / `confirm` / `prompt` заборонені умовою роботи, тому сервіс
 * інкапсулює Bootstrap-компоненти: короткі статуси — toast-ами,
 * запити рішення чи вводу — модальними вікнами.
 *
 * Решта коду залежить тільки від цього фасаду: щоб замінити Bootstrap
 * на будь-що інше, достатньо переписати Modal/Toast — виклики не зміняться.
 */
export class NotificationService {
  /** Довільне toast-повідомлення. */
  public notify(message: string, type: NotificationType = NotificationType.Info): void {
    ToastContainer.show(message, type);
  }

  public success(message: string): void {
    this.notify(message, NotificationType.Success);
  }

  public error(message: string): void {
    this.notify(message, NotificationType.Error);
  }

  public warning(message: string): void {
    this.notify(message, NotificationType.Warning);
  }

  public info(message: string): void {
    this.notify(message, NotificationType.Info);
  }

  /** Модальне повідомлення з однією кнопкою (замість alert). */
  public showMessage(message: string, buttonLabel = 'Зрозуміло!'): Promise<void> {
    return Modal.info(message, buttonLabel);
  }

  /** Модальне підтвердження дії. */
  public confirm(options: ConfirmOptions): Promise<boolean> {
    return Modal.confirm(options);
  }

  /** Модальне вікно з полем вводу (ID користувача при позичанні). */
  public prompt(options: PromptOptions): Promise<string | null> {
    return Modal.prompt(options);
  }
}
