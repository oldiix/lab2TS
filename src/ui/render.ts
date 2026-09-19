import type { LibraryService } from '../services/LibraryService';
import { OperationError } from '../services/LibraryService';
import type { NotificationService } from '../services/NotificationService';
import type { BookFormValues, UserFormValues } from '../types';
import { PAGE_SIZE } from '../types';
import { Validation } from '../utils/validators';
import { BookForm } from './components/BookForm';
import { BookList } from './components/BookList';
import { UserForm } from './components/UserForm';
import { UserList } from './components/UserList';
import { el } from './dom';

/** Стан подання: окремі сторінка й пошуковий запит для кожного списку. */
interface ViewState {
  bookPage: number;
  bookQuery: string;
  userPage: number;
  userQuery: string;
}

/**
 * Кореневий рендерер застосунку.
 *
 * Єдиний клас, що знає і про сервіси, і про DOM: форми та списки лише
 * повідомляють про наміри користувача, а рішення (що зробити й що
 * показати) ухвалюються тут. Каркас сторінки будується один раз у
 * mount(), далі перемальовуються тільки внутрішні блоки списків —
 * повний ре-рендер скидав би фокус і текст у полі пошуку.
 */
export class AppView {
  private readonly root: HTMLElement;
  private readonly service: LibraryService;
  private readonly notifications: NotificationService;

  private readonly bookForm: BookForm;
  private readonly userForm: UserForm;
  private readonly bookList: BookList;
  private readonly userList: UserList;
  private readonly statsEl: HTMLParagraphElement;

  private state: ViewState = {
    bookPage: 1,
    bookQuery: '',
    userPage: 1,
    userQuery: '',
  };

  public constructor(
    root: HTMLElement,
    service: LibraryService,
    notifications: NotificationService,
  ) {
    this.root = root;
    this.service = service;
    this.notifications = notifications;
    this.statsEl = el('p', { className: 'text-center text-muted small mb-4' });

    this.bookForm = new BookForm((values) => this.handleAddBook(values));
    this.userForm = new UserForm((values) => this.handleAddUser(values));

    this.bookList = new BookList({
      onBorrow: (bookId: string): void => void this.handleBorrow(bookId),
      onReturn: (bookId: string): void => void this.handleReturn(bookId),
      onDelete: (bookId: string): void => void this.handleDeleteBook(bookId),
      onPageChange: (page: number): void => {
        this.state.bookPage = page;
        this.refresh();
      },
      onSearch: (query: string): void => {
        this.state.bookQuery = query;
        this.state.bookPage = 1;
        this.refresh();
      },
    });

    this.userList = new UserList({
      onDelete: (userId: string): void => void this.handleDeleteUser(userId),
      onPageChange: (page: number): void => {
        this.state.userPage = page;
        this.refresh();
      },
      onSearch: (query: string): void => {
        this.state.userQuery = query;
        this.state.userPage = 1;
        this.refresh();
      },
    });
  }

  /** Побудувати каркас сторінки та вивести початковий стан. */
  public mount(): void {
    const layout = el(
      'div',
      { className: 'container py-4' },
      el(
        'div',
        { className: 'bg-body-secondary rounded-3 p-3 p-md-4' },
        el('h1', {
          className: 'h3 text-center fw-bold mb-2',
          text: 'Система Управління Бібліотекою',
        }),
        this.statsEl,
        this.bookForm.render(),
        this.userForm.render(),
        this.bookList.render(),
        this.userList.render(),
      ),
    );

    this.root.replaceChildren(layout);
    this.refresh();
  }

  /** Перемалювати списки та лічильники з актуального стану сервісу. */
  private refresh(): void {
    const booksPage = this.service.getBooksPage(
      this.state.bookPage,
      this.state.bookQuery,
      PAGE_SIZE,
    );
    const usersPage = this.service.getUsersPage(
      this.state.userPage,
      this.state.userQuery,
      PAGE_SIZE,
    );

    // Сторінка могла «з'їхати» після видалення останнього елемента.
    this.state.bookPage = booksPage.page;
    this.state.userPage = usersPage.page;

    this.bookList.update(booksPage, this.state.bookQuery);
    this.userList.update(usersPage, this.state.userQuery);

    this.statsEl.textContent =
      `Книг: ${this.service.getBookCount()} · ` +
      `позичено: ${this.service.getBorrowedCount()} · ` +
      `користувачів: ${this.service.getUserCount()}`;
  }

  private handleAddBook(values: BookFormValues): void {
    const result = this.service.addBook(values);
    if (!result.ok) {
      this.notifications.error(result.message);
      return;
    }
    this.notifications.success(`Книгу «${result.value.title}» додано.`);
    this.refresh();
  }

  private handleAddUser(values: UserFormValues): void {
    const result = this.service.addUser(values);
    if (!result.ok) {
      this.notifications.error(result.message);
      return;
    }
    this.notifications.success(`Користувача ${result.value.name} додано (ID ${result.value.id}).`);
    this.refresh();
  }

  /**
   * Позичання: модальне вікно з ID → перевірка ліміту → підтвердження.
   * Ліміт у 3 книги показується окремим модальним вікном, як вимагає умова.
   */
  private async handleBorrow(bookId: string): Promise<void> {
    const book = this.service.findBook(bookId);
    if (book === undefined) {
      this.notifications.error('Книгу не знайдено.');
      return;
    }

    if (this.service.getUserCount() === 0) {
      await this.notifications.showMessage(
        'Спочатку додайте хоча б одного користувача — позичати книгу нікому.',
      );
      return;
    }

    const userId = await this.notifications.prompt({
      title: 'Введіть ID користувача для позичення книги:',
      placeholder: 'ID',
      confirmLabel: 'Зберегти',
      cancelLabel: 'Скасувати',
      validate: (value) => Validation.validateUserIdInput(value),
    });

    if (userId === null) {
      return;
    }

    const result = this.service.borrowBook(bookId, userId);
    if (!result.ok) {
      if (result.reason === OperationError.LimitReached) {
        await this.notifications.showMessage(result.message);
      } else {
        this.notifications.error(result.message);
      }
      return;
    }

    this.refresh();
    await this.notifications.showMessage(
      `${result.value.book.getLabel()} has been borrowed by ${result.value.user.getLabel()}.`,
      'Зрозуміло!',
    );
  }

  private async handleReturn(bookId: string): Promise<void> {
    const result = this.service.returnBook(bookId);
    if (!result.ok) {
      this.notifications.error(result.message);
      return;
    }

    this.refresh();
    await this.notifications.showMessage(
      `${result.value.book.getLabel()} has been returned.`,
      'Закрити',
    );
  }

  private async handleDeleteBook(bookId: string): Promise<void> {
    const book = this.service.findBook(bookId);
    if (book === undefined) {
      return;
    }

    const confirmed = await this.notifications.confirm({
      title: 'Видалити книгу?',
      message: book.isBorrowed
        ? `«${book.getLabel()}» зараз позичена. Видалити її та зняти з користувача?`
        : `«${book.getLabel()}» буде видалено назавжди.`,
      confirmLabel: 'Видалити',
      confirmVariant: 'btn-danger',
    });

    if (!confirmed) {
      return;
    }

    const result = this.service.removeBook(bookId);
    if (!result.ok) {
      this.notifications.error(result.message);
      return;
    }
    this.notifications.warning(`Книгу «${result.value.title}» видалено.`);
    this.refresh();
  }

  private async handleDeleteUser(userId: string): Promise<void> {
    const user = this.service.findUser(userId);
    if (user === undefined) {
      return;
    }

    const confirmed = await this.notifications.confirm({
      title: 'Видалити користувача?',
      message:
        user.borrowedCount > 0
          ? `${user.name} тримає ${user.borrowedCount} кн. — вони повернуться до бібліотеки.`
          : `${user.getLabel()} буде видалено назавжди.`,
      confirmLabel: 'Видалити',
      confirmVariant: 'btn-danger',
    });

    if (!confirmed) {
      return;
    }

    const result = this.service.removeUser(userId);
    if (!result.ok) {
      this.notifications.error(result.message);
      return;
    }
    this.notifications.warning(`Користувача ${result.value.name} видалено.`);
    this.refresh();
  }
}
