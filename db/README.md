# Neon / Drizzle (этап B)

Схема и миграции лежат здесь, но пакеты Drizzle **не** входят в обычный `npm install` сайта.

Перед миграциями:

```bash
npm i drizzle-orm @neondatabase/serverless
npm i -D drizzle-kit
# DATABASE_URL=... в .env.local
npx drizzle-kit generate
npx drizzle-kit migrate
```
