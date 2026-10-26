# Velin

Демонстрационный магазин техники (RU/EN). Этап A работает на моках. Этап B (Neon) подключается через `DATABASE_URL`.

## Стек

- Next.js App Router, Tailwind, next-intl
- `packages/contracts` — Zod-контракты API
- `packages/data` — репозитории (mock по умолчанию)
- `db/` — схема Neon (пакеты Drizzle ставятся отдельно, см. `db/README.md`)

## Запуск

```bash
npm install
npm run dev
```

Демо-вход: `buyer@velin.demo` / `demo1234`  
Админ: `admin@velin.demo` / `admin1234`

## Скрипты

- `npm run dev` / `npm run build` / `npm test`

## Neon

Если `DATABASE_URL` — адрес Postgres, пользователи, адреса, избранное, корзины и заказы хранятся в Neon (`packages/data/src/neon.ts`). Таблицы с приставкой `velin_` создаются сами при первом запросе и не трогают старые таблицы BAYHAN MARKET в той же базе. Каталог пока остаётся демо из `packages/data/src/seed.ts`. Без `DATABASE_URL` (или с `DATA_SOURCE=mock`) всё работает на моках.

- Пароли хранятся как scrypt-хеш. Сброс пароля по почте в режиме Neon выключен, пока нет отправки писем.
- Демо-админ `admin@velin.demo` в Neon не создаётся, потому что его пароль публичный. Права админа получают Google-аккаунты из `ADMIN_EMAILS` (через запятую).
- Тесты прогоняют Neon-репозитории на PGlite: `npm test`.

## Деплой

Vercel Root Directory — **пустой** (корень репо).
