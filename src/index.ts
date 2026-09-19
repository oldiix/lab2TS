import './styles/main.scss';

import { LibraryService } from './services/LibraryService';
import { NotificationService } from './services/NotificationService';
import { requireElement } from './ui/dom';
import { AppView } from './ui/render';

/**
 * Точка входу.
 *
 * Композиційний корінь: тут і тільки тут створюються сервіси та
 * подання, після чого керування передається AppView. Уся розмітка
 * генерується з коду — в index.html лишається лише <div id="app">.
 */
function bootstrap(): void {
  const root = requireElement<HTMLDivElement>('#app');

  const service = new LibraryService();
  service.load();

  const notifications = new NotificationService();
  const view = new AppView(root, service, notifications);
  view.mount();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
