import { expect } from 'chai';
import { Book } from '../src/models/Book';
import { User } from '../src/models/User';
import { Library } from '../src/services/Library';
import { LibraryService, OperationError } from '../src/services/LibraryService';
import { MemoryStorageDriver, Storage } from '../src/services/Storage';
import type { BookDto, UserDto } from '../src/types';
import { BookStatus, MAX_BORROWED_BOOKS } from '../src/types';

/** Фабрика книги з передбачуваним id — щоб тести не залежали від генератора. */
function makeBook(id: string, title = 'Clean Code', author = 'Robert Martin', year = 2008): Book {
  return new Book(id, title, author, year);
}

function makeUser(id: string, name = 'Артем', email = 'artem@example.com'): User {
  return new User(id, name, email);
}

describe('Library<T> — узагальнена колекція', () => {
  describe('add()', () => {
    it('додає елемент і збільшує розмір колекції', () => {
      const library = new Library<Book>();
      const added = library.add(makeBook('b1'));

      expect(added).to.equal(true);
      expect(library.size).to.equal(1);
    });

    it('не додає дублікат за id і повертає false', () => {
      const library = new Library<Book>([makeBook('b1')]);
      const added = library.add(makeBook('b1', 'Інша назва'));

      expect(added).to.equal(false);
      expect(library.size).to.equal(1);
      expect(library.findById('b1')?.title).to.equal('Clean Code');
    });

    it('addMany() повертає кількість фактично доданих елементів', () => {
      const library = new Library<Book>([makeBook('b1')]);
      const added = library.addMany([makeBook('b1'), makeBook('b2'), makeBook('b3')]);

      expect(added).to.equal(2);
      expect(library.size).to.equal(3);
    });

    it('працює з різними типами сутностей (generic)', () => {
      const users = new Library<User>();
      users.add(makeUser('1725533394038'));

      expect(users.findById('1725533394038')?.name).to.equal('Артем');
    });
  });

  describe('remove()', () => {
    it('видаляє наявний елемент і повертає true', () => {
      const library = new Library<Book>([makeBook('b1'), makeBook('b2')]);

      expect(library.remove('b1')).to.equal(true);
      expect(library.size).to.equal(1);
      expect(library.findById('b1')).to.equal(undefined);
    });

    it('повертає false для неіснуючого id', () => {
      const library = new Library<Book>([makeBook('b1')]);

      expect(library.remove('missing')).to.equal(false);
      expect(library.size).to.equal(1);
    });
  });

  describe('пошук', () => {
    it('findById() повертає саме той екземпляр, який додали', () => {
      const book = makeBook('b1');
      const library = new Library<Book>([book]);

      expect(library.findById('b1')).to.equal(book);
    });

    it('find() повертає перший елемент за предикатом', () => {
      const library = new Library<Book>([
        makeBook('b1', 'Clean Code', 'Robert Martin', 2008),
        makeBook('b2', 'Code Complete', 'Steve McConnell', 2004),
      ]);

      const found = library.find((book) => book.year < 2005);

      expect(found?.id).to.equal('b2');
    });

    it('find() повертає undefined, якщо збігів немає', () => {
      const library = new Library<Book>([makeBook('b1')]);

      expect(library.find((book) => book.year === 1900)).to.equal(undefined);
    });

    it('filter() повертає всі збіги за предикатом', () => {
      const library = new Library<Book>([
        makeBook('b1', 'Clean Code', 'Robert Martin'),
        makeBook('b2', 'Clean Architecture', 'Robert Martin'),
        makeBook('b3', 'Code Complete', 'Steve McConnell'),
      ]);

      const martin = library.filter((book) => book.author === 'Robert Martin');

      expect(martin).to.have.lengthOf(2);
      expect(martin.map((book) => book.id)).to.deep.equal(['b1', 'b2']);
    });

    it('has() перевіряє наявність за id', () => {
      const library = new Library<Book>([makeBook('b1')]);

      expect(library.has('b1')).to.equal(true);
      expect(library.has('b9')).to.equal(false);
    });
  });

  describe('getAll() / clear() / update()', () => {
    it('getAll() зберігає порядок додавання', () => {
      const library = new Library<Book>();
      library.add(makeBook('b1'));
      library.add(makeBook('b2'));
      library.add(makeBook('b3'));

      expect(library.getAll().map((book) => book.id)).to.deep.equal(['b1', 'b2', 'b3']);
    });

    it('getAll() повертає копію — зміна масиву не чіпає колекцію', () => {
      const library = new Library<Book>([makeBook('b1')]);
      const snapshot = library.getAll();
      snapshot.pop();

      expect(library.size).to.equal(1);
    });

    it('update() замінює елемент із тим самим id', () => {
      const library = new Library<Book>([makeBook('b1', 'Стара назва')]);
      const replaced = library.update(makeBook('b1', 'Нова назва'));

      expect(replaced).to.equal(true);
      expect(library.findById('b1')?.title).to.equal('Нова назва');
    });

    it('update() повертає false для відсутнього id', () => {
      const library = new Library<Book>();

      expect(library.update(makeBook('b1'))).to.equal(false);
      expect(library.isEmpty).to.equal(true);
    });

    it('clear() спорожнює колекцію', () => {
      const library = new Library<Book>([makeBook('b1'), makeBook('b2')]);
      library.clear();

      expect(library.size).to.equal(0);
      expect(library.isEmpty).to.equal(true);
    });
  });

  describe('paginate()', () => {
    const library = new Library<Book>(
      Array.from({ length: 12 }, (_, index) => makeBook(`b${index + 1}`)),
    );

    it('повертає рівно pageSize елементів на повній сторінці', () => {
      const page = library.paginate(1, 5);

      expect(page.items).to.have.lengthOf(5);
      expect(page.totalItems).to.equal(12);
      expect(page.totalPages).to.equal(3);
    });

    it('остання сторінка містить залишок', () => {
      const page = library.paginate(3, 5);

      expect(page.items).to.have.lengthOf(2);
      expect(page.items[0]?.id).to.equal('b11');
    });

    it('обрізає номер сторінки до допустимого діапазону', () => {
      expect(library.paginate(0, 5).page).to.equal(1);
      expect(library.paginate(99, 5).page).to.equal(3);
    });

    it('порожня колекція дає одну порожню сторінку', () => {
      const page = new Library<Book>().paginate(1, 5);

      expect(page.items).to.have.lengthOf(0);
      expect(page.totalPages).to.equal(1);
    });
  });
});

describe('LibraryService — позичання та повернення', () => {
  let service: LibraryService;

  beforeEach(() => {
    // In-memory драйвер: тести не залежать від LocalStorage і не течуть один в одного.
    service = new LibraryService(
      new Storage<BookDto>('test:books', new MemoryStorageDriver()),
      new Storage<UserDto>('test:users', new MemoryStorageDriver()),
    );
  });

  function addBook(title = 'Clean Code'): string {
    const result = service.addBook({ title, author: 'Robert Martin', year: '2008' });
    if (!result.ok) {
      throw new Error('Не вдалося створити книгу для тесту');
    }
    return result.value.id;
  }

  function addUser(name = 'Артем', email = 'artem@example.com'): string {
    const result = service.addUser({ name, email });
    if (!result.ok) {
      throw new Error('Не вдалося створити користувача для тесту');
    }
    return result.value.id;
  }

  it('borrowBook() позначає книгу позиченою і записує її користувачу', () => {
    const bookId = addBook();
    const userId = addUser();

    const result = service.borrowBook(bookId, userId);

    expect(result.ok).to.equal(true);
    expect(service.findBook(bookId)?.status).to.equal(BookStatus.Borrowed);
    expect(service.findBook(bookId)?.borrowedBy).to.equal(userId);
    expect(service.findUser(userId)?.borrowedCount).to.equal(1);
  });

  it('не дає позичити вже позичену книгу', () => {
    const bookId = addBook();
    const first = addUser('Артем', 'artem@example.com');
    const second = addUser('Мартін', 'martin@example.com');

    service.borrowBook(bookId, first);
    const result = service.borrowBook(bookId, second);

    expect(result.ok).to.equal(false);
    if (!result.ok) {
      expect(result.reason).to.equal(OperationError.AlreadyBorrowed);
    }
  });

  it(`не дає позичити більше ніж ${MAX_BORROWED_BOOKS} книги`, () => {
    const userId = addUser();
    const ids = Array.from({ length: MAX_BORROWED_BOOKS + 1 }, (_, i) => addBook(`Книга ${i}`));

    for (let i = 0; i < MAX_BORROWED_BOOKS; i += 1) {
      expect(service.borrowBook(ids[i] as string, userId).ok).to.equal(true);
    }

    const overLimit = service.borrowBook(ids[MAX_BORROWED_BOOKS] as string, userId);

    expect(overLimit.ok).to.equal(false);
    if (!overLimit.ok) {
      expect(overLimit.reason).to.equal(OperationError.LimitReached);
    }
    expect(service.findUser(userId)?.borrowedCount).to.equal(MAX_BORROWED_BOOKS);
  });

  it('повідомляє про неіснуючого користувача', () => {
    const bookId = addBook();
    const result = service.borrowBook(bookId, '0000000000');

    expect(result.ok).to.equal(false);
    if (!result.ok) {
      expect(result.reason).to.equal(OperationError.UserNotFound);
    }
  });

  it('returnBook() звільняє книгу і зменшує лічильник користувача', () => {
    const bookId = addBook();
    const userId = addUser();
    service.borrowBook(bookId, userId);

    const result = service.returnBook(bookId);

    expect(result.ok).to.equal(true);
    expect(service.findBook(bookId)?.isBorrowed).to.equal(false);
    expect(service.findUser(userId)?.borrowedCount).to.equal(0);
  });

  it('видалення користувача повертає його книги до бібліотеки', () => {
    const bookId = addBook();
    const userId = addUser();
    service.borrowBook(bookId, userId);

    service.removeUser(userId);

    expect(service.findUser(userId)).to.equal(undefined);
    expect(service.findBook(bookId)?.isBorrowed).to.equal(false);
  });

  it('видалення позиченої книги знімає її з користувача', () => {
    const bookId = addBook();
    const userId = addUser();
    service.borrowBook(bookId, userId);

    service.removeBook(bookId);

    expect(service.findBook(bookId)).to.equal(undefined);
    expect(service.findUser(userId)?.borrowedCount).to.equal(0);
  });

  it('searchBooks() шукає і за назвою, і за автором', () => {
    addBook('Clean Code');
    addBook('Code Complete');

    expect(service.searchBooks('clean')).to.have.lengthOf(1);
    expect(service.searchBooks('robert martin')).to.have.lengthOf(2);
    expect(service.searchBooks('')).to.have.lengthOf(2);
  });

  it('не додає двох користувачів з однаковим email', () => {
    addUser('Артем', 'same@example.com');
    const duplicate = service.addUser({ name: 'Інший', email: 'SAME@example.com' });

    expect(duplicate.ok).to.equal(false);
    if (!duplicate.ok) {
      expect(duplicate.reason).to.equal(OperationError.Duplicate);
    }
  });

  it('стан переживає перезавантаження: load() відновлює дані зі сховища', () => {
    const booksDriver = new MemoryStorageDriver();
    const usersDriver = new MemoryStorageDriver();
    const first = new LibraryService(
      new Storage<BookDto>('test:books', booksDriver),
      new Storage<UserDto>('test:users', usersDriver),
    );

    const book = first.addBook({ title: 'Clean Code', author: 'Robert Martin', year: '2008' });
    const user = first.addUser({ name: 'Артем', email: 'artem@example.com' });
    if (!book.ok || !user.ok) {
      throw new Error('Не вдалося підготувати дані');
    }
    first.borrowBook(book.value.id, user.value.id);

    const restored = new LibraryService(
      new Storage<BookDto>('test:books', booksDriver),
      new Storage<UserDto>('test:users', usersDriver),
    );
    restored.load();

    expect(restored.getBookCount()).to.equal(1);
    expect(restored.findBook(book.value.id)?.isBorrowed).to.equal(true);
    expect(restored.findUser(user.value.id)?.borrowedCount).to.equal(1);
  });
});
