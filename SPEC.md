# SPEC — Technical Specification

> Версия 1.0 · Базовый стек выбран для постепенной реализации веба, Telegram Mini App и Expo.

## 1. Технологии
| Слой | Технология | Почему |
|---|---|---|
| Web | Next.js App Router + TypeScript | SEO, SSR, маршруты, серверные компоненты |
| UI | Tailwind CSS + CSS variables + компоненты Radix/shadcn/ui по необходимости | единые токены, доступность |
| Motion | Motion for React | управляемые анимации |
| Данные | Supabase PostgreSQL + migrations + RLS | отношения, пользователи, политики доступа |
| Auth | Supabase Auth (email/password, Google OAuth) | готовые потоки авторизации |
| Storage | Supabase Storage | изображения товаров/аватаров |
| API | Next.js Route Handlers + сервисный слой | единый HTTP API для разных клиентов |
| Validation | Zod | схемы входных данных и контрактов |
| Client state | Zustand (корзина UI), TanStack Query при необходимости | понятное управление состоянием |
| Localization | next-intl (web), общий JSON-словарь | RU/EN и URL локали |
| Test | Vitest + Testing Library + Playwright | unit, integration, E2E |
| Monitoring | Sentry или аналог (опционально) | наблюдаемость |
| Deploy | Vercel для web/API, Supabase managed | без Docker на первом этапе |

**Важное ограничение:** API через Next Route Handlers подходит для MVP; если нагрузка, фоновые задания и интеграции вырастут, выделить самостоятельный Fastify API/worker без переписывания контрактов.

## 2. Репозиторий и границы
```text
apps/
  web/                    # Next.js сайт и админка
  telegram/               # отдельный web UI Mini App — позже
  mobile/                 # Expo/React Native — позже
packages/
  contracts/              # Zod DTO, типы API, статусы
  api-client/             # вызовы API с токенами доступа
  domain/                 # чистые бизнес-правила, расчёты
  design-tokens/          # цвета, шрифты, отступы, motion-токены
  i18n/                   # общие переводы, где возможно
supabase/
  migrations/
  seed.sql
  policies/
docs/
  PRD.md SPEC.md TASKS.md TASKSGUIDE.md
```
На первом этапе создавать реально только используемые пакеты. **Не пытаться импортировать веб-компоненты напрямую в React Native:** разделять токены, контракты, данные, а UI создавать платформенный.

## 3. Домены и сущности PostgreSQL
- `profiles`: id (ссылка на auth.users), display_name, avatar_path, phone, timestamps.
- `user_roles`: user_id, role (`customer`, `admin`); выдача роли только доверенным серверным процессом.
- `addresses`: id, user_id, recipient, phone, city, street, notes, is_default.
- `categories`: id, parent_id, slug, sort_order, is_active.
- `category_translations`: category_id, locale, name, description.
- `brands`: id, name, slug, logo_path.
- `products`: id, brand_id, category_id, slug, status, featured, timestamps.
- `product_translations`: product_id, locale, title, description, seo_title, seo_description.
- `product_variants`: id, product_id, sku (unique), attributes JSONB, price_uzs bigint, compare_at_uzs, stock_quantity, is_active.
- `product_images`: id, product_id, variant_id nullable, path, alt_ru, alt_en, sort_order.
- `attribute_definitions` + `attribute_options` + translations: фильтры по категориям.
- `product_specs`: product_id, attribute_id, value (или typed value), единицы измерения.
- `favorites`: user_id, product_id; unique(user_id, product_id).
- `carts` и `cart_items`: owner_id или server-issued guest token, variant_id, quantity.
- `orders`: id, user_id nullable, guest_contact, number unique, currency, subtotal_uzs, discount_uzs, shipping_uzs, total_uzs, status, payment_status, address_snapshot JSONB, timestamps.
- `order_items`: order_id, variant_id nullable, sku_snapshot, title_snapshot, unit_price_uzs, quantity, line_total_uzs.
- `payments`: id, order_id, provider, provider_payment_id, status, amount, currency, idempotency_key unique, timestamps.
- `payment_events`: provider, external_event_id unique, payload reference, processed_at.
- `promotions`, `promotion_translations`, `banners`, `banner_translations`.
- `reviews` (P1): user_id, product_id, rating, body, moderation_status.
- `telegram_identities` (P2): telegram_user_id unique, profile_id, linked_at.

**Деньги:** целочисленные UZS в базе; округление — на сервере. Реальное хранение валюты и её минимальных единиц для платежного провайдера определять по его документации. SKU и цена варианта обязательны.

## 4. API v1 (HTTP, JSON)
Префикс `/api/v1`, схемы в `packages/contracts`, ответы валидировать.

| Метод | Маршрут | Доступ |
|---|---|---|
| GET | `/categories`, `/brands` | публичный |
| GET | `/products?category=&q=&sort=&cursor=&filters=` | публичный |
| GET | `/products/:slug` | публичный |
| GET | `/search/suggest?q=` | публичный |
| GET/POST/PATCH/DELETE | `/cart`, `/cart/items` | guest/session |
| GET/POST/DELETE | `/favorites` | пользователь |
| POST | `/orders` | guest/session, rate-limit |
| GET | `/me/orders`, `/me/orders/:id` | только владелец |
| GET/PATCH | `/me/profile`, `/me/addresses` | только владелец |
| GET/POST/PATCH/DELETE | `/admin/products` | admin |
| GET/PATCH | `/admin/orders` | admin |
| POST | `/payments/:provider/checkout` | владелец заказа, P1 |
| POST | `/webhooks/stripe`, `/webhooks/yookassa` | проверенная подпись/авторизация P1 |
| POST | `/auth/telegram` | валидированный initData, P2 |

Сортировка и поля фильтров — whitelist. Публичные ответы не раскрывают конфиденциальные поля. Ограничить max page size. Ошибки стандартизированы: `{ error: { code, message, requestId } }`.

## 5. Бизнес-правила
1. Результат поиска/каталога не показывает товары `draft`/`archived`.
2. Корзина сохраняет `variant_id`, а не произвольную клиентскую цену; сервер заново рассчитывает итог.
3. Заказ создаётся атомарно в транзакции: перечитать цену и запас, зарезервировать/уменьшить запас по выбранной политике, записать позиции и заказ; конкурентные запросы не должны давать отрицательный остаток.
4. Статусы заказа: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`; переходы проверяются на сервере.
5. Статусы оплаты: `unpaid`, `pending`, `paid`, `failed`, `refunded` (P1).
6. Анонимная корзина переносится в учётную запись после входа с проверкой повторов.
7. Сравнение ограничить одной совместимой категорией и 2–4 товарами.
8. Авто-назначение роли admin клиентом запрещено. Контент сохранять с корректной локалью.

## 6. Авторизация и безопасность
- Supabase Auth: email/password, подтверждение email, reset-password, Google OAuth с callback URL; проверка redirect allowlist.
- Для web — безопасная session-обработка через серверные cookies; токены не записывать в публичные логи.
- RLS для `profiles`, `addresses`, `favorites`, `orders` и др.; никакого публичного доступа к чужим данным.
- Админские операции требуют проверки роли **на сервере**. Service-role secret только в server environment.
- Zod на всех write-endpoints; лимиты, rate-limiting, CSRF-защита там, где применимо, защищённые заголовки, аудит админских изменений.
- Google OAuth используется на сайте; Telegram `initData` проверяется на сервере, потом связывается с аккаунтом по явно подтверждённой процедуре.
- Expo: токены через SecureStore; никаких secret keys в клиентских сборках.
- Изображения: ограничения типов/размеров, Storage policies; документы с персональными данными не публичны.

## 7. Платежи (отдельный P1)
Интерфейс `PaymentProvider` с методами `createCheckout(order)`, `verifyNotification(request)`, `fetchStatus(paymentId)`, `refund(...)` (если поддерживается). Адаптеры `StripeProvider` и `YooKassaProvider`.

**Процесс:** сервер создаёт заказ → сервер создаёт тестовый платёж → провайдер отдаёт checkout URL → браузер открывает → webhook проверяется → сервер идемпотентно меняет оплату и заказ → пользователь видит результат по запросу к API.

Не доверять success URL. Webhook может прийти повторно или раньше возврата браузера. Хранить `payment_events.external_event_id`, idempotency key, безопасно обрабатывать ошибки. Проверить региональную доступность платформ и валют **до начала интеграции**. Тестовый режим не означает реального получения денег.

## 8. RU / EN / SEO
- Маршруты: `/ru/...` и `/en/...`; язык переключается с сохранением текущего маршрута, где есть перевод.
- Все UI-строки, алерты, email-templates, названия категорий и SEO-заголовки переведены.
- `Intl.NumberFormat` для денег и дат; цены всегда в UZS на MVP.
- Canonical, hreflang, sitemap, OpenGraph, JSON-LD Product/BreadcrumbList где данные правдивы.
- Server-rendering для публичных страниц и нормальная индексация; админку и приватные разделы закрыть от индексации.

## 9. Responsive + качество
- Breakpoints ориентировочно 360, 390, 768, 1024, 1440; без горизонтального скролла.
- Изображения с responsive sizes и lazy-loading (кроме hero), целевые метрики: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 на типичных устройствах при реалистичном соединении.
- Skeleton/loading/error/empty для поиска, карточек, корзины, заказов; корректная работа при медленной сети.
- Тесты: сервис расчёта суммы/остатков, доступ к заказам, RLS policies, auth, admin permission, E2E checkout, i18n переключение, мобильная навигация.
- Визуальный QA: соответствие токенам, PAS в промо, контраст, focus, reduced motion.

## 10. UX ключевых страниц
- **Главная:** hero + компактные преимущества, бенто категории, промо, категории, товары, storytelling PAS и отзывы (P1).
- **Каталог:** breadcrumbs, название, число товаров, фильтры, сортировка, ясная цена, наличие, quick add.
- **Товар:** галерея, модель/SKU, варианты, характеристики, цена, доставка, гарантия, add to cart, compare.
- **Checkout:** минимальные поля, видимый заказ и итог, валидация, подтверждение, понятные ошибки.
- **Личный кабинет:** понятные вкладки, редактирование профиля, placeholder аватара, мои заказы и история.
- **Админка:** таблица товаров, форма с RU/EN, SKU и остатками, список заказов со сменой статуса.

## 11. Развитие Telegram и Expo
- Один backend/API и база заказов; каждое приложение использует общие DTO.
- Токены дизайн-системы общий пакет, но компоненты web и native разные.
- Telegram: адаптировать размеры под viewport, safe areas, кнопку «назад», Telegram theme при необходимости; не доверять user_id из JS без подписи initData.
- Expo: Expo Router, native экраны каталога/товара/корзины/заказов, SecureStore, react-native-safe-area-context, deep links; авторизация через поддерживаемый mobile OAuth flow.
- Платежи и правила Telegram/Apple/Google тщательно перепроверять в момент реализации для продажи физических товаров.

## 12. Environment (пример названий, без секретов)
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # server only
NEXT_PUBLIC_SITE_URL=
STRIPE_SECRET_KEY=            # P1, server only
STRIPE_WEBHOOK_SECRET=       # P1, server only
YOOKASSA_SHOP_ID=           # P1, server only
YOOKASSA_SECRET_KEY=        # P1, server only
PAYMENTS_MODE=disabled      # disabled|test|live
TELEGRAM_BOT_TOKEN=         # P2, server only
```
Секреты держать в менеджере env, `.env.local` в `.gitignore`; предоставить `.env.example` с пустыми значениями.

## 13. Definition of Done
На каждый этап: код + миграции + тесты + UI состояний + обе локали + проверка mobile + отсутствие ошибок сборки/линтера + краткое обновление документации. Ни одна фича не считается готовой только по красивому скриншоту.
