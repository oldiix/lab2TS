import { Book } from '../models/Book';
import { User } from '../models/User';
import type { BookDto, BookFormValues, Page, UserDto, UserFormValues } from '../types';
import { MAX_BORROWED_BOOKS, PAGE_SIZE, STORAGE_KEYS } from '../types';
import { generateId, generateNumericId } from '../utils/idGenerator';
import { Library } from './Library';
import { Storage } from './Storage';

/** Причини, через які операція може не виконатись. */
export enum OperationError {
  BookNotFound = 'BOOK_NOT_FOUND',
  UserNotFound = 'USER_NOT_FOUND',
  AlreadyBorrowed = 'ALREADY_BORROWED',
  NotBorrowed = 'NOT_BORROWED',
  LimitReached = 'LIMIT_REACHED',
  Duplicate = 'DUPLICATE',
}

/** Розмічене об'єднання: або успіх зі значенням, або помилка з причиною. */
export type OperationResult<T> =
  { ok: true; value: T } | { ok: false; reason: OperationError; message: string };

function fail<T>(reason: OperationError, message: string): OperationResult<T> {
  return { ok: false, reason, message };
}

function ok<T>(value: T): OperationResult<T> {
  return { ok: true, value };
}

/**
 * Фасад над двома колекціями (`Library<Book>` і `Library<User>`) та LocalStorage.
 *
 * Тут зосереджені всі бізнес-правила: ліміт у 3 книги, узгодженість
 * «книга позичена ⇄ id книги в списку користувача», каскадне звільнення
 * книг при видаленні користувача. Шар UI лише викликає методи й читає
 * результат — DOM у цьому файлі не згадується жодного разу.
 */
export class LibraryService {
  private readonly books: Library<Book>;
  private readonly users: Library<User>;
  private readonly booksStorage: Storage<BookDto>;
  private readonly usersStorage: Storage<UserDto>;

  public constructor(
    booksStorage: Storage<BookDto> = new Storage<BookDto>(STORAGE_KEYS.books),
    usersStorage: Storage<UserDto> = new Storage<UserDto>(STORAGE_KEYS.users),
  ) {
    this.booksStorage = booksStorage;
    this.usersStorage = usersStorage;
    this.books = new Library<Book>();
    this.users = new Library<User>();
  }

  /** Відновити стан із LocalStorage. Викликається один раз при старті. */
  public load(): void {
    this.books.clear();
    this.users.clear();
    this.books.addMany(this.booksStorage.load().map(Book.fromJSON));
    this.users.addMany(this.usersStorage.load().map(User.fromJSON));
  }

  /** Зберегти обидві колекції. */
  public persist(): void {
    this.booksStorage.save(this.books.map((book) => book.toJSON()));
    this.usersStorage.save(this.users.map((user) => user.toJSON()));
  }

  public getBooks(): Book[] {
    return this.books.getAll();
  }

  public getUsers(): User[] {
    return this.users.getAll();
  }

  public getBookCount(): number {
    return this.books.size;
  }

  public getUserCount(): number {
    return this.users.size;
  }

  public getBorrowedCount(): number {
    return this.books.filter((book) => book.isBorrowed).length;
  }

  public findUser(id: string): User | undefined {
    return this.users.findById(id);
  }

  public findBook(id: string): Book | undefined {
    return this.books.findById(id);
  }

  /** Пошук книг за назвою або автором. */
  public searchBooks(query: string): Book[] {
    return this.books.filter((book) => book.matches(query));
  }

  /** Пошук користувачів за іменем, email або id. */
  public searchUsers(query: string): User[] {
    return this.users.filter((user) => user.matches(query));
  }

  /** Сторінка книг із урахуванням пошукового запиту. */
  public getBooksPage(page: number, query = '', pageSize: number = PAGE_SIZE): Page<Book> {
    return this.books.paginate(page, pageSize, this.searchBooks(query));
  }

  /** Сторінка користувачів із урахуванням пошукового запиту. */
  public getUsersPage(page: number, query = '', pageSize: number = PAGE_SIZE): Page<User> {
    return this.users.paginate(page, pageSize, this.searchUsers(query));
  }

  /** Додати книгу. Рік уже провалідовано на рівні форми. */
  public addBook(values: BookFormValues): OperationResult<Book> {
    const book = new Book(generateId('book'), values.title, values.author, Number(values.year));
    if (!this.books.add(book)) {
      return fail(OperationError.Duplicate, 'Книга з таким id вже існує.');
    }
    this.persist();
    return ok(book);
  }

  /** Додати користувача. Id генерується з самих цифр (вимога валідації). */
  public addUser(values: UserFormValues): OperationResult<User> {
    const duplicate = this.users.find((user) => user.email === values.email.trim().toLowerCase());
    if (duplicate !== undefined) {
      return fail(OperationError.Duplicate, `Користувач з email ${duplicate.email} вже існує.`);
    }
    const user = new User(generateNumericId(), values.name, values.email);
    this.users.add(user);
    this.persist();
    return ok(user);
  }

  /** Видалити книгу; якщо вона позичена — звільнити її в користувача. */
  public removeBook(bookId: string): OperationResult<Book> {
    const book = this.books.findById(bookId);
    if (book === undefined) {
      return fail(OperationError.BookNotFound, 'Книгу не знайдено.');
    }
    if (book.borrowedBy !== null) {
      this.users.findById(book.borrowedBy)?.removeBorrowedBook(book.id);
    }
    this.books.remove(bookId);
    this.persist();
    return ok(book);
  }

  /** Видалити користувача; усі його книги повертаються до бібліотеки. */
  public removeUser(userId: string): OperationResult<User> {
    const user = this.users.findById(userId);
    if (user === undefined) {
      return fail(OperationError.UserNotFound, 'Користувача не знайдено.');
    }
    for (const bookId of user.borrowedBookIds) {
      const book = this.books.findById(bookId);
      if (book !== undefined && book.isBorrowed) {
        book.giveBack();
      }
    }
    this.users.remove(userId);
    this.persist();
    return ok(user);
  }

  /**
   * Позичити книгу.
   *
   * Порядок перевірок важливий: спершу існування сутностей, потім стан
   * книги, і лише тоді ліміт — щоб користувач отримав найточніше
   * повідомлення про причину відмови.
   */
  public borrowBook(bookId: string, userId: string): OperationResult<{ book: Book; user: User }> {
    const book = this.books.findById(bookId);
    if (book === undefined) {
      return fail(OperationError.BookNotFound, 'Книгу не знайдено.');
    }

    const user = this.users.findById(userId);
    if (user === undefined) {
      return fail(OperationError.UserNotFound, `Користувача з ID ${userId} не знайдено.`);
    }

    if (book.isBorrowed) {
      return fail(OperationError.AlreadyBorrowed, `"${book.getLabel()}" вже позичена.`);
    }

    if (!user.canBorrow()) {
      return fail(
        OperationError.LimitReached,
        `Користувач ${user.name} вже позичив ${MAX_BORROWED_BOOKS} книги. ` +
          'Поверніть одну з них, щоб позичити нову.',
      );
    }

    user.addBorrowedBook(book.id);
    book.borrow(user.id);
    this.persist();
    return ok({ book, user });
  }

  /** Повернути книгу до бібліотеки. */
  public returnBook(bookId: string): OperationResult<{ book: Book; user: User | undefined }> {
    const book = this.books.findById(bookId);
    if (book === undefined) {
      return fail(OperationError.BookNotFound, 'Книгу не знайдено.');
    }
    if (!book.isBorrowed) {
      return fail(OperationError.NotBorrowed, `"${book.getLabel()}" не була позичена.`);
    }

    const user = book.borrowedBy !== null ? this.users.findById(book.borrowedBy) : undefined;
    user?.removeBorrowedBook(book.id);
    book.giveBack();
    this.persist();
    return ok({ book, user });
  }

  /** Повне очищення бібліотеки (і стану, і LocalStorage). */
  public reset(): void {
    this.books.clear();
    this.users.clear();
    this.persist();
  }
}
