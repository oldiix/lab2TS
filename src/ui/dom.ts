/**
 * Мінімальні хелпери для програмного створення DOM.
 *
 * Уся розмітка застосунку будується цими функціями — в index.html
 * лишається тільки <div id="app"></div>, як вимагає умова роботи.
 * Текст завжди виставляється через textContent, а не innerHTML,
 * тому введені користувачем назви книг не можуть виконати скрипт (XSS).
 */

/** Властивості, які можна передати у фабрику елементів. */
export interface ElementOptions {
  className?: string;
  text?: string;
  id?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  title?: string;
  dataset?: Record<string, string>;
  attrs?: Record<string, string>;
  onClick?: (event: MouseEvent) => void;
}

/**
 * Створити елемент із набором властивостей і дочірніми вузлами.
 * Generic по тегу — повертає точний тип (HTMLInputElement для 'input' тощо).
 */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
  ...children: (Node | string | null)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  if (options.className !== undefined) {
    node.className = options.className;
  }
  if (options.text !== undefined) {
    node.textContent = options.text;
  }
  if (options.id !== undefined) {
    node.id = options.id;
  }
  if (options.title !== undefined) {
    node.title = options.title;
  }
  if (options.type !== undefined && 'type' in node) {
    (node as HTMLInputElement).type = options.type;
  }
  if (options.value !== undefined && 'value' in node) {
    (node as HTMLInputElement).value = options.value;
  }
  if (options.placeholder !== undefined && 'placeholder' in node) {
    (node as HTMLInputElement).placeholder = options.placeholder;
  }
  if (options.dataset !== undefined) {
    for (const [key, value] of Object.entries(options.dataset)) {
      node.dataset[key] = value;
    }
  }
  if (options.attrs !== undefined) {
    for (const [key, value] of Object.entries(options.attrs)) {
      node.setAttribute(key, value);
    }
  }
  if (options.onClick !== undefined) {
    node.addEventListener('click', options.onClick as EventListener);
  }

  for (const child of children) {
    if (child === null) {
      continue;
    }
    node.append(child);
  }

  return node;
}

/** Замінити весь вміст контейнера новими вузлами (один reflow замість N). */
export function replaceChildren(container: HTMLElement, ...children: Node[]): void {
  container.replaceChildren(...children);
}

/** Знайти елемент або кинути зрозумілу помилку замість мовчазного null. */
export function requireElement<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector);
  if (node === null) {
    throw new Error(`Не знайдено елемент за селектором "${selector}"`);
  }
  return node;
}
