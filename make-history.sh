#!/usr/bin/env bash
#
# Відтворює git-історію проєкту з нуля: feature branch workflow
# + Conventional Commits + merge --no-ff.
#
# Запускати з кореня проєкту (там, де package.json), у теці БЕЗ .git:
#   chmod +x make-history.sh && ./make-history.sh
#
# Після цього:
#   git remote add origin git@github.com:<твій-нік>/<repo>.git
#   git push -u origin main
#   git push origin vite-migration

set -euo pipefail

if [ -d .git ]; then
  echo "✖ .git вже існує. Видали його або запусти в чистій копії проєкту."
  exit 1
fi

if [ ! -f package.json ]; then
  echo "✖ Немає package.json — запусти скрипт з кореня проєкту."
  exit 1
fi

# --- 0. Залежності (потрібні, бо pre-commit hook ганяє lint і тести) -------
if [ ! -d node_modules ]; then
  echo "▶ npm install…"
  npm install
fi

git init -b main
# Підстав свої дані, якщо глобальний git config не налаштований:
# git config user.name  "Ім'я Прізвище"
# git config user.email "you@example.com"

c() { git commit -q -m "$1"; }
merge() { git checkout -q main && git merge -q --no-ff "$1" -m "merge: підключити $1"; }

# --- 1. main: ініціалізація ----------------------------------------------
git add package.json package-lock.json .gitignore
c "chore: ініціалізувати npm-проєкт та базові залежності"

# --- 2. feat/build-setup --------------------------------------------------
git checkout -q -b feat/build-setup
git add tsconfig.json tsconfig.test.json webpack.config.js index.html public/favicon.svg
c "build: налаштувати webpack, ts-loader та dev-server на порту 9000"
git add .eslintrc.json .prettierrc .prettierignore .mocharc.json
c "chore: додати конфігурації ESLint, Prettier та Mocha"
merge feat/build-setup

# --- 3. feat/models -------------------------------------------------------
git checkout -q -b feat/models
git add src/types/index.ts
c "feat(types): описати спільні типи, enum-и та константи застосунку"
git add src/models/
c "feat(models): додати класи Book і User з інтерфейсами IBook та IUser"
merge feat/models

# --- 4. feat/validation ---------------------------------------------------
git checkout -q -b feat/validation
git add src/utils/idGenerator.ts
c "feat(utils): додати генератор id (числовий для користувачів)"
git add src/utils/validators.ts
c "feat(validation): реалізувати namespace Validation з правилами форм"
merge feat/validation

# --- 5. feat/library-service ----------------------------------------------
git checkout -q -b feat/library-service
git add src/services/Library.ts
c "feat(services): реалізувати generic-клас Library<T> на базі Map"
git add src/services/Storage.ts
c "feat(services): додати типізовану обгортку Storage над LocalStorage"
git add src/services/LibraryService.ts
c "feat(services): додати позичання, повернення та ліміт у 3 книги"
merge feat/library-service

# --- 6. feat/ui -----------------------------------------------------------
git checkout -q -b feat/ui
git add src/ui/dom.ts src/ui/components/FormField.ts
c "feat(ui): додати DOM-хелпери та компонент поля форми"
git add src/ui/components/Modal.ts src/ui/components/Toast.ts src/services/NotificationService.ts
c "feat(ui): реалізувати модальні вікна й toast замість alert"
git add src/ui/components/BookForm.ts src/ui/components/UserForm.ts
c "feat(ui): додати форми книги та користувача з показом помилок"
git add src/ui/components/Pagination.ts src/ui/components/BookList.ts src/ui/components/UserList.ts
c "feat(ui): додати списки з пошуком і пагінацією по 5 записів"
git add src/ui/render.ts src/index.ts src/styles/main.scss
c "feat(ui): зібрати застосунок у точці входу та підключити Bootstrap"
merge feat/ui

# --- 7. test/unit-tests ---------------------------------------------------
git checkout -q -b test/unit-tests
git add tests/validation.test.ts
c "test(validation): покрити обов'язкові поля, id та рік видання"
git add tests/library.test.ts
c "test(library): покрити додавання, видалення, пошук і позичання"
merge test/unit-tests

# --- 8. chore/husky -------------------------------------------------------
# З цього моменту кожен наступний коміт проганяє ESLint і Mocha.
git checkout -q -b chore/husky
git add .husky/pre-commit
c "chore(husky): блокувати коміт, якщо ESLint або Mocha не пройшли"
npx husky
merge chore/husky

# --- 9. docs/readme -------------------------------------------------------
git checkout -q -b docs/readme
git add README.md docs/ .github/ make-history.sh
c "docs: додати README зі структурою, звітом та порівнянням webpack і Vite"
merge docs/readme

# --- 10. vite-migration ---------------------------------------------------
# Версії файлів для Vite лежать у теці vite-branch/ — скрипт переносить
# їх у корінь уже всередині гілки, а на main лишається webpack-варіант.
# Тека vite-branch/ весь час лишалась untracked (вона у .gitignore),
# тому тут просто копіюємо з неї файли в корінь і комітимо.
if [ -d vite-branch ]; then
  git checkout -q -b vite-migration
  git rm -q webpack.config.js
  cp vite-branch/* .
  rm -rf vite-branch
  git add vite.config.ts index.html package.json tsconfig.json package-lock.json
  c "build: замінити webpack на Vite (dev-сервер, збірка, TS та SCSS)"
  git checkout -q main
  echo "▶ Щоб працювати на гілці vite-migration: git checkout vite-migration && npm install"
fi

echo
echo "✔ Готово. Історія:"
git log --oneline --graph | head -40
echo
echo "Далі:"
echo "  git remote add origin git@github.com:<нік>/<repo>.git"
echo "  git push -u origin main"
