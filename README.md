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

Пока сайт на моках. Для Neon: `DATABASE_URL` в `.env.local` (не в git) и шаги из `db/README.md`.

## Деплой

Vercel Root Directory — **пустой** (корень репо).
