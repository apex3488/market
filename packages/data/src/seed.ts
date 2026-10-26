import type { Brand, Category, Product, Promo, Variant } from "./types";

const demo = {
  ru: "Демонстрационная карточка. Это не предложение магазина.",
  en: "Demonstration card. This is not a store offer.",
};

export const brands: Brand[] = [
  { id: "nordline", slug: "nordline", name: "Nordline" },
  { id: "kestrel", slug: "kestrel", name: "Kestrel" },
  { id: "vanta", slug: "vanta", name: "Vanta" },
  { id: "lumenwerk", slug: "lumenwerk", name: "Lumenwerk" },
  { id: "sable", slug: "sable", name: "Sable" },
  { id: "arca", slug: "arca", name: "Arca" },
];

export const categories: Category[] = [
  cat("smartfony", null, 1, "/demo/phone.jpg", "Смартфоны и гаджеты", "Smartphones and gadgets", "Телефоны и карманные устройства.", "Phones and pocket devices."),
  cat("telefony", "smartfony", 2, "/demo/phone.jpg", "Телефоны", "Phones", "Смартфоны демонстрационного каталога.", "Phones in the demonstration catalog."),
  cat("kompyutery", null, 3, "/demo/laptop.jpg", "Компьютеры и ноутбуки", "Computers and laptops", "Ноутбуки и настольные компьютеры.", "Laptops and desktop computers."),
  cat("noutbuki", "kompyutery", 4, "/demo/laptop.jpg", "Ноутбуки", "Laptops", "Портативные компьютеры.", "Portable computers."),
  cat("nastolnye", "kompyutery", 5, "/demo/laptop.jpg", "Настольные ПК", "Desktops", "Системные блоки.", "Desktop towers."),
  cat("tv-audio", null, 6, "/demo/tv.jpg", "ТВ и аудио", "TV and audio", "Телевизоры и звук.", "Televisions and sound."),
  cat("krupnaya-tehnika", null, 7, "/demo/appliance.jpg", "Крупная бытовая техника", "Large appliances", "Техника для кухни и стирки.", "Kitchen and laundry appliances."),
  cat("melkaya-tehnika", null, 8, "/demo/kitchen.jpg", "Мелкая бытовая техника", "Small appliances", "Компактная техника для дома.", "Compact home appliances."),
  cat("aksessuary", null, 9, "/demo/audio.jpg", "Аксессуары", "Accessories", "Зарядки, чехлы и звук.", "Chargers, cases, and audio."),
];

export const promos: Promo[] = [
  {
    id: "laptops",
    href: "/c/noutbuki",
    image: "/demo/laptop.jpg",
    problem: { ru: "Ноутбук тормозит в работе?", en: "Does the laptop stall while you work?" },
    agitate: { ru: "Каждая задержка сбивает темп.", en: "Every delay breaks the pace." },
    solution: { ru: "Подберите модель под ваши задачи.", en: "Match a model to the work you do." },
    cta: { ru: "Смотреть ноутбуки", en: "Browse laptops" },
  },
  {
    id: "phones",
    href: "/c/telefony",
    image: "/demo/phone.jpg",
    problem: { ru: "Заряда не хватает до вечера?", en: "Does the battery die before evening?" },
    agitate: { ru: "Ищете розетку вместо того, чтобы заниматься делами.", en: "You look for an outlet instead of getting things done." },
    solution: { ru: "Сравните модели с ёмкой батареей.", en: "Compare models with a larger battery." },
    cta: { ru: "Выбрать смартфон", en: "Choose a phone" },
  },
  {
    id: "kitchen",
    href: "/c/melkaya-tehnika",
    image: "/demo/kitchen.jpg",
    problem: { ru: "На готовку уходит слишком много времени?", en: "Does cooking take too long?" },
    agitate: { ru: "Рутинные задачи занимают вечер.", en: "Routine tasks take the evening." },
    solution: { ru: "Техника, которая упрощает быт.", en: "Appliances that shorten the chores." },
    cta: { ru: "Открыть подборку", en: "Open the selection" },
  },
];

type Row = {
  slug: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  featured?: boolean;
  status?: "draft" | "published";
  ru: string;
  en: string;
  ruText: string;
  enText: string;
};

const rows: Row[] = [
  row("nordline-s9", "nordline", "telefony", 12_490_000, 8, "Nordline S9", "Экран 6,7 дюйма.", "6.7 inch screen.", true),
  row("nordline-s7", "nordline", "telefony", 7_990_000, 15, "Nordline S7", "Компактный корпус.", "Compact body."),
  row("kestrel-air", "kestrel", "telefony", 15_990_000, 4, "Kestrel Air", "Лёгкий алюминиевый корпус.", "Light aluminum body.", true),
  row("vanta-note", "vanta", "telefony", 5_490_000, 22, "Vanta Note", "Простой повседневный телефон.", "Everyday phone."),
  row("lumenwerk-pico", "lumenwerk", "telefony", 4_290_000, 11, "Lumenwerk Pico", "Небольшой экран.", "Smaller screen."),
  row("sable-fold", "sable", "telefony", 18_990_000, 3, "Sable Fold", "Складной формат.", "Folding format.", true),
  row("nordline-book-14", "nordline", "noutbuki", 14_990_000, 6, "Nordline Book 14", "14 дюймов, для работы с документами.", "14 inch, for documents.", true),
  row("kestrel-studio-16", "kestrel", "noutbuki", 22_900_000, 4, "Kestrel Studio 16", "16 дюймов, для монтажа.", "16 inch, for editing."),
  row("vanta-air-13", "vanta", "noutbuki", 9_990_000, 9, "Vanta Air 13", "Тонкий 13-дюймовый ноутбук.", "Thin 13 inch laptop."),
  row("sable-pro-15", "sable", "noutbuki", 16_990_000, 2, "Sable Pro 15", "15 дюймов, отдельная графика в демо-описании.", "15 inch, discrete graphics in the demo text."),
  row("arca-desk", "arca", "nastolnye", 18_900_000, 5, "Arca Desk", "Настольный корпус для дома.", "Desktop tower for home.", true),
  row("lumenwerk-tower", "lumenwerk", "nastolnye", 11_990_000, 7, "Lumenwerk Tower", "Базовый системный блок.", "Basic desktop tower."),
  row("vanta-qled-55", "vanta", "tv-audio", 8_990_000, 6, "Vanta QLED 55", "Диагональ 55 дюймов.", "55 inch screen.", true),
  row("lumenwerk-oled-65", "lumenwerk", "tv-audio", 18_990_000, 2, "Lumenwerk OLED 65", "Диагональ 65 дюймов.", "65 inch screen."),
  row("nordline-led-43", "nordline", "tv-audio", 4_290_000, 14, "Nordline LED 43", "Диагональ 43 дюйма.", "43 inch screen."),
  row("kestrel-soundbar", "kestrel", "tv-audio", 2_490_000, 10, "Kestrel Soundbar", "Саундбар для телевизора.", "Soundbar for a television."),
  row("sable-frame-50", "sable", "tv-audio", 7_590_000, 4, "Sable Frame 50", "Тонкая рамка, 50 дюймов.", "Thin frame, 50 inch."),
  row("arca-oled-77", "arca", "tv-audio", 27_990_000, 1, "Arca OLED 77", "Диагональ 77 дюймов.", "77 inch screen."),
  row("arca-fridge-360", "arca", "krupnaya-tehnika", 12_990_000, 3, "Arca Fridge 360", "Холодильник, объём указан как демо.", "Fridge, volume is a demo figure.", true),
  row("nordline-wash-8", "nordline", "krupnaya-tehnika", 6_990_000, 8, "Nordline Wash 8", "Стиральная машина на 8 кг.", "8 kg washing machine."),
  row("vanta-dry-9", "vanta", "krupnaya-tehnika", 7_490_000, 5, "Vanta Dry 9", "Сушильная машина на 9 кг.", "9 kg dryer."),
  row("kestrel-dishwasher", "kestrel", "krupnaya-tehnika", 8_190_000, 4, "Kestrel Dishwasher", "Посудомоечная машина.", "Dishwasher."),
  row("sable-hood", "sable", "krupnaya-tehnika", 3_190_000, 9, "Sable Hood", "Вытяжка для кухни.", "Kitchen hood."),
  row("lumenwerk-oven", "lumenwerk", "krupnaya-tehnika", 5_590_000, 6, "Lumenwerk Oven", "Духовой шкаф.", "Built-in oven."),
  row("nordline-kettle", "nordline", "melkaya-tehnika", 490_000, 30, "Nordline Kettle", "Чайник 1,7 л.", "1.7 L kettle.", true),
  row("vanta-blender", "vanta", "melkaya-tehnika", 890_000, 18, "Vanta Blender", "Стационарный блендер.", "Countertop blender."),
  row("kestrel-coffee", "kestrel", "melkaya-tehnika", 2_490_000, 7, "Kestrel Coffee", "Кофемашина для дома.", "Home coffee machine."),
  row("sable-vacuum", "sable", "melkaya-tehnika", 1_990_000, 12, "Sable Vacuum", "Пылесос без мешка.", "Bagless vacuum."),
  row("arca-iron", "arca", "melkaya-tehnika", 390_000, 20, "Arca Iron", "Утюг с паром.", "Steam iron."),
  row("lumenwerk-airfryer", "lumenwerk", "melkaya-tehnika", 1_290_000, 11, "Lumenwerk Airfryer", "Аэрогриль на 5 л.", "5 L air fryer."),
  row("nordline-case", "nordline", "aksessuary", 190_000, 40, "Nordline Case", "Чехол для телефона.", "Phone case."),
  row("kestrel-charger", "kestrel", "aksessuary", 290_000, 25, "Kestrel Charger", "Зарядка 30 Вт.", "30 W charger.", true),
  row("vanta-cable", "vanta", "aksessuary", 90_000, 50, "Vanta Cable", "Кабель 1 м.", "1 m cable."),
  row("sable-buds", "sable", "aksessuary", 790_000, 16, "Sable Buds", "Беспроводные наушники.", "Wireless earbuds."),
  row("arca-band", "arca", "aksessuary", 450_000, 13, "Arca Band", "Браслет, черновик каталога.", "Band, catalog draft.", false, "draft"),
  row("lumenwerk-glass", "lumenwerk", "aksessuary", 120_000, 0, "Lumenwerk Glass", "Стекло на экран.", "Screen glass."),
];

function row(
  slug: string,
  brand: string,
  category: string,
  price: number,
  stock: number,
  name: string,
  ruText: string,
  enText: string,
  featured = false,
  status: "draft" | "published" = "published",
): Row {
  return { slug, brand, category, price, stock, ru: name, en: name, ruText, enText, featured, status };
}

function cat(
  slug: string,
  parentId: string | null,
  sortOrder: number,
  image: string,
  ru: string,
  en: string,
  ruText: string,
  enText: string,
): Category {
  return {
    id: slug,
    parentId,
    slug,
    sortOrder,
    image,
    translations: {
      ru: { name: ru, description: ruText },
      en: { name: en, description: enText },
    },
  };
}

function variantsFor(item: Row): Variant[] {
  if (item.slug === "nordline-s9") {
    return [
      variant(item, "128", item.price, item.stock, "128 ГБ", "128 GB"),
      variant(item, "256", item.price + 1_500_000, 5, "256 ГБ", "256 GB"),
    ];
  }
  if (item.slug === "kestrel-studio-16") {
    return [
      variant(item, "16gb", item.price, item.stock, "16 ГБ памяти", "16 GB memory"),
      variant(item, "32gb", item.price + 2_400_000, 2, "32 ГБ памяти", "32 GB memory"),
    ];
  }
  return [variant(item, "base", item.price, item.stock, "Основная комплектация", "Standard set")];
}

function variant(item: Row, suffix: string, price: number, stock: number, ru: string, en: string): Variant {
  return {
    id: `${item.slug}-${suffix}`,
    sku: `${item.slug}-${suffix}`.toUpperCase(),
    priceUzs: price,
    stockQuantity: stock,
    label: { ru, en },
  };
}

const imageFor: Record<string, string> = {
  telefony: "/demo/phone.jpg",
  noutbuki: "/demo/laptop.jpg",
  nastolnye: "/demo/laptop.jpg",
  "tv-audio": "/demo/tv.jpg",
  "krupnaya-tehnika": "/demo/appliance.jpg",
  "melkaya-tehnika": "/demo/kitchen.jpg",
  aksessuary: "/demo/audio.jpg",
};

export const products: Product[] = rows.map((item) => ({
  id: item.slug,
  brandId: item.brand,
  categoryId: item.category,
  slug: item.slug,
  status: item.status ?? "published",
  featured: Boolean(item.featured),
  image: imageFor[item.category] ?? "/demo/phone.jpg",
  translations: {
    ru: { title: item.ru, description: `${item.ruText} ${demo.ru}` },
    en: { title: item.en, description: `${item.enText} ${demo.en}` },
  },
  variants: variantsFor(item),
  specs: [
    {
      label: { ru: "Категория", en: "Category" },
      value: {
        ru: categories.find((entry) => entry.id === item.category)?.translations.ru.name ?? item.category,
        en: categories.find((entry) => entry.id === item.category)?.translations.en.name ?? item.category,
      },
    },
    {
      label: { ru: "Наличие", en: "Stock" },
      value: {
        ru: item.stock > 0 ? `${item.stock} шт. в демо-остатке` : "Нет в демо-остатке",
        en: item.stock > 0 ? `${item.stock} demo units` : "No demo stock",
      },
    },
    {
      label: { ru: "Примечание", en: "Note" },
      value: { ru: demo.ru, en: demo.en },
    },
  ],
}));

export function cloneProducts(): Product[] {
  return structuredClone(products);
}
