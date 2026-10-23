/**
 * Demonstration catalog. Prices and stock are illustrative only and are not a commercial offer.
 * Prices are written in whole UZS and converted to minor units by the seed script.
 * Images: Unsplash (free license), hot-linked from images.unsplash.com.
 */
const U = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const IMG = {
  phoneWhite: U("1511707171634-5f897ff02aa9"),
  phoneDark: U("1592750475338-74b7b21085ab"),
  phoneBlack: U("1610945415295-d9bbf067e59c"),
  phoneApps: U("1598327105666-5b89351aff97"),
  phoneFront: U("1580910051074-3eb694886505"),
  laptopDesk: U("1496181133206-80ce9b88a853"),
  laptopPurple: U("1517336714731-489689fd1ca8"),
  laptopWork: U("1593642632823-8f785ba67e45"),
  laptopOpen: U("1588872657578-7efd1f1555ed"),
  laptopColor: U("1525547719571-a2d4ac8945e2"),
  laptopSilver: U("1611186871348-b1ce696e52c9"),
  deskSetup: U("1587831990711-23ca6441447b"),
  gamingSetup: U("1593640408182-31c70c8268f5"),
  gpu: U("1591799264318-7e6ef8ddb7ea"),
  pcCase: U("1587202372775-e229f172b9d7"),
  cpu: U("1555617981-dac3880eac6e"),
  aio: U("1527443224154-c4a3942d3acf"),
  keyboard: U("1587829741301-dc798b83add3"),
  mouse: U("1527864550417-7fd91fc51a46"),
  tabletDark: U("1544244015-0df4b3ffc6b0"),
  tabletHand: U("1561154464-82e9adf32764"),
  tv: U("1593359677879-a4bb92f829d1"),
  headphonesYellow: U("1505740420928-5e560c06d30e"),
  headphonesWhite: U("1546435770-a3e426bf472b"),
  speaker: U("1608043152269-423dbba4e7e1"),
  watch: U("1546868871-7041f2a55e12"),
  kitchen: U("1556911220-bff31c812dba"),
  coffee: U("1570222094114-d054a817e56b"),
  microwave: U("1585659722983-3a675dabf23d"),
  washer: U("1626806787461-102c1bfaaea1"),
  oven: U("1574269909862-7e1d70bb8078"),
  robotVacuum: U("1558317374-067fb5f30001"),
  fridge: U("1571175443880-49e1d25b2bc5"),
  smartPhoneHome: U("1558002038-1055907df827"),
  speakerShelf: U("1545454675-3531b543be5d"),
  headphonesWood: U("1484704849700-f032a568e944"),
  earbuds: U("1572569511254-d8f925fe2cbb"),
  watchBlack: U("1600294037681-c80b4cb5b434"),
  accessories: U("1550009158-9ebf69173e03"),
  techFlat: U("1498049794561-7780e7231661"),
};

export const categories = [
  { slug: "smartphones", nameRu: "Смартфоны", nameEn: "Smartphones", icon: "phone", imageUrl: IMG.phoneFront, specFilters: ["storage", "ram", "os"] },
  { slug: "laptops", nameRu: "Ноутбуки", nameEn: "Laptops", icon: "laptop", imageUrl: IMG.laptopPurple, specFilters: ["cpu", "ram", "storage"] },
  { slug: "computers", nameRu: "Компьютеры и моноблоки", nameEn: "Desktops & All-in-ones", icon: "desktop", imageUrl: IMG.aio, specFilters: ["cpu", "ram"] },
  { slug: "pc-components", nameRu: "Комплектующие для ПК", nameEn: "PC Components", icon: "cpu", imageUrl: IMG.gpu, specFilters: ["type"] },
  { slug: "monitors-peripherals", nameRu: "Мониторы и периферия", nameEn: "Monitors & Peripherals", icon: "monitor", imageUrl: IMG.deskSetup, specFilters: ["type"] },
  { slug: "tablets", nameRu: "Планшеты", nameEn: "Tablets", icon: "tablet", imageUrl: IMG.tabletDark, specFilters: ["storage", "display"] },
  { slug: "tv-audio", nameRu: "Телевизоры и аудио", nameEn: "TV & Audio", icon: "tv", imageUrl: IMG.tv, specFilters: ["type"] },
  { slug: "home-appliances", nameRu: "Бытовая техника", nameEn: "Home Appliances", icon: "washer", imageUrl: IMG.washer, specFilters: ["type"] },
  { slug: "kitchen", nameRu: "Техника для кухни", nameEn: "Kitchen Appliances", icon: "kitchen", imageUrl: IMG.kitchen, specFilters: ["type"] },
  { slug: "smart-home", nameRu: "Умный дом и аксессуары", nameEn: "Smart Home & Accessories", icon: "home", imageUrl: IMG.smartPhoneHome, specFilters: ["type"] },
];

export const brands = [
  "Apple", "Samsung", "Xiaomi", "Google", "Lenovo", "ASUS", "HP", "Dell", "NVIDIA", "AMD", "Intel", "LG", "Sony",
  "JBL", "Bosch", "Philips", "De'Longhi", "Dyson", "Logitech", "Artel", "Anker",
].map((name) => ({ name, slug: name.toLowerCase().replace("'", "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }));

type SpecTuple = [key: string, ru: string, en: string, value: string];
type VariantTuple = { name: string; options?: Record<string, string>; price: number; compareAt?: number; stock: number };

export interface SeedProduct {
  slug: string;
  name: string;
  brand: string;
  category: string;
  images: string[];
  ru: string;
  en: string;
  specs: SpecTuple[];
  variants: VariantTuple[];
  isNew?: boolean;
  isFeatured?: boolean;
}

const S = {
  storage: (v: string): SpecTuple => ["storage", "Встроенная память", "Storage", v],
  ram: (v: string): SpecTuple => ["ram", "Оперативная память", "RAM", v],
  display: (v: string): SpecTuple => ["display", "Экран", "Display", v],
  os: (v: string): SpecTuple => ["os", "Операционная система", "OS", v],
  cpu: (v: string): SpecTuple => ["cpu", "Процессор", "Processor", v],
  camera: (v: string): SpecTuple => ["camera", "Основная камера", "Main camera", v],
  battery: (v: string): SpecTuple => ["battery", "Аккумулятор", "Battery", v],
  weight: (v: string): SpecTuple => ["weight", "Вес", "Weight", v],
  type: (ru: string): SpecTuple => ["type", "Тип", "Type", ru],
  power: (v: string): SpecTuple => ["power", "Мощность", "Power", v],
  gpu: (v: string): SpecTuple => ["gpu", "Видеокарта", "Graphics", v],
  diagonal: (v: string): SpecTuple => ["diagonal", "Диагональ", "Screen size", v],
  resolution: (v: string): SpecTuple => ["resolution", "Разрешение", "Resolution", v],
  refresh: (v: string): SpecTuple => ["refresh", "Частота обновления", "Refresh rate", v],
  connect: (v: string): SpecTuple => ["connectivity", "Подключение", "Connectivity", v],
  volume: (v: string): SpecTuple => ["volume", "Объём", "Capacity", v],
  energy: (v: string): SpecTuple => ["energy", "Класс энергопотребления", "Energy class", v],
  warranty: (v: string): SpecTuple => ["warranty", "Гарантия производителя", "Manufacturer warranty", v],
};

export const products: SeedProduct[] = [
  // ---------- Smartphones ----------
  {
    slug: "apple-iphone-16-pro", name: "Apple iPhone 16 Pro", brand: "apple", category: "smartphones", isFeatured: true, isNew: true,
    images: [IMG.phoneFront, IMG.phoneDark, IMG.phoneApps],
    ru: "Флагман Apple с титановым корпусом, чипом A18 Pro и системой камер Pro с 5-кратным оптическим зумом. Кнопка «Управление камерой» для быстрой съёмки.",
    en: "Apple's flagship with a titanium design, A18 Pro chip and Pro camera system with 5× optical zoom. Camera Control for quick capture.",
    specs: [S.display('6,3" Super Retina XDR, 120 Гц'), S.cpu("Apple A18 Pro"), S.ram("8 GB"), S.storage("256 GB"), S.camera("48 + 48 + 12 МП"), S.os("iOS")],
    variants: [
      { name: "256 GB · Desert Titanium", options: { storage: "256 GB", color: "Desert Titanium" }, price: 16_990_000, stock: 12 },
      { name: "512 GB · Black Titanium", options: { storage: "512 GB", color: "Black Titanium" }, price: 19_490_000, stock: 6 },
      { name: "1 TB · Natural Titanium", options: { storage: "1 TB", color: "Natural Titanium" }, price: 22_990_000, stock: 2 },
    ],
  },
  {
    slug: "apple-iphone-16", name: "Apple iPhone 16", brand: "apple", category: "smartphones", isNew: true,
    images: [IMG.phoneWhite, IMG.phoneApps],
    ru: "iPhone 16 с чипом A18, кнопкой действия и двойной камерой 48 МП. Яркий дисплей Super Retina XDR и долгое время работы.",
    en: "iPhone 16 with A18 chip, Action button and 48 MP dual camera. Bright Super Retina XDR display and long battery life.",
    specs: [S.display('6,1" Super Retina XDR'), S.cpu("Apple A18"), S.ram("8 GB"), S.storage("128 GB"), S.camera("48 + 12 МП"), S.os("iOS")],
    variants: [
      { name: "128 GB · Ultramarine", options: { storage: "128 GB", color: "Ultramarine" }, price: 12_490_000, compareAt: 13_290_000, stock: 15 },
      { name: "256 GB · Black", options: { storage: "256 GB", color: "Black" }, price: 14_190_000, stock: 8 },
    ],
  },
  {
    slug: "samsung-galaxy-s25-ultra", name: "Samsung Galaxy S25 Ultra", brand: "samsung", category: "smartphones", isFeatured: true, isNew: true,
    images: [IMG.phoneBlack, IMG.phoneDark],
    ru: "Galaxy S25 Ultra: Snapdragon 8 Elite for Galaxy, камера 200 МП, встроенное перо S Pen и функции Galaxy AI.",
    en: "Galaxy S25 Ultra: Snapdragon 8 Elite for Galaxy, 200 MP camera, built-in S Pen and Galaxy AI features.",
    specs: [S.display('6,9" Dynamic AMOLED 2X, 120 Гц'), S.cpu("Snapdragon 8 Elite"), S.ram("12 GB"), S.storage("256 GB"), S.camera("200 + 50 + 50 + 10 МП"), S.battery("5000 мА·ч"), S.os("Android")],
    variants: [
      { name: "12/256 GB · Titanium Black", options: { storage: "256 GB", color: "Titanium Black" }, price: 15_990_000, compareAt: 17_490_000, stock: 9 },
      { name: "12/512 GB · Titanium Silverblue", options: { storage: "512 GB", color: "Titanium Silverblue" }, price: 17_990_000, stock: 4 },
    ],
  },
  {
    slug: "samsung-galaxy-a56", name: "Samsung Galaxy A56 5G", brand: "samsung", category: "smartphones",
    images: [IMG.phoneApps],
    ru: "Сбалансированный смартфон с AMOLED-экраном 120 Гц, защитой IP67 и шестью годами обновлений ОС.",
    en: "Well-balanced smartphone with a 120 Hz AMOLED display, IP67 protection and six years of OS updates.",
    specs: [S.display('6,7" Super AMOLED, 120 Гц'), S.cpu("Exynos 1580"), S.ram("8 GB"), S.storage("256 GB"), S.battery("5000 мА·ч"), S.os("Android")],
    variants: [{ name: "8/256 GB · Awesome Graphite", options: { storage: "256 GB" }, price: 5_390_000, stock: 20 }],
  },
  {
    slug: "xiaomi-15", name: "Xiaomi 15", brand: "xiaomi", category: "smartphones", isNew: true,
    images: [IMG.phoneDark, IMG.phoneBlack],
    ru: "Компактный флагман с оптикой Leica, процессором Snapdragon 8 Elite и быстрой зарядкой 90 Вт.",
    en: "Compact flagship with Leica optics, Snapdragon 8 Elite and 90 W fast charging.",
    specs: [S.display('6,36" AMOLED, 120 Гц'), S.cpu("Snapdragon 8 Elite"), S.ram("12 GB"), S.storage("256 GB"), S.camera("50 + 50 + 50 МП"), S.os("Android")],
    variants: [
      { name: "12/256 GB · Black", options: { storage: "256 GB" }, price: 10_490_000, stock: 7 },
      { name: "12/512 GB · White", options: { storage: "512 GB" }, price: 11_690_000, stock: 3 },
    ],
  },
  {
    slug: "xiaomi-redmi-note-14-pro", name: "Xiaomi Redmi Note 14 Pro", brand: "xiaomi", category: "smartphones",
    images: [IMG.phoneWhite],
    ru: "Популярная модель среднего класса с камерой 200 МП и ярким AMOLED-дисплеем.",
    en: "Popular mid-range model with a 200 MP camera and bright AMOLED display.",
    specs: [S.display('6,67" AMOLED, 120 Гц'), S.ram("8 GB"), S.storage("256 GB"), S.camera("200 МП"), S.battery("5500 мА·ч"), S.os("Android")],
    variants: [{ name: "8/256 GB", options: { storage: "256 GB" }, price: 3_790_000, compareAt: 4_190_000, stock: 25 }],
  },
  {
    slug: "google-pixel-9", name: "Google Pixel 9", brand: "google", category: "smartphones",
    images: [IMG.phoneBlack],
    ru: "Pixel 9 с чипом Tensor G4, продвинутой вычислительной фотографией и чистым Android.",
    en: "Pixel 9 with Tensor G4, advanced computational photography and clean Android.",
    specs: [S.display('6,3" Actua OLED'), S.cpu("Google Tensor G4"), S.ram("12 GB"), S.storage("128 GB"), S.os("Android")],
    variants: [{ name: "12/128 GB · Obsidian", options: { storage: "128 GB" }, price: 9_290_000, stock: 0 }],
  },
  // ---------- Laptops ----------
  {
    slug: "apple-macbook-air-13-m4", name: 'Apple MacBook Air 13" M4', brand: "apple", category: "laptops", isFeatured: true, isNew: true,
    images: [IMG.laptopSilver, IMG.laptopDesk],
    ru: "Тонкий и бесшумный MacBook Air на чипе M4: до 18 часов автономной работы и дисплей Liquid Retina.",
    en: "Thin, fanless MacBook Air with M4 chip: up to 18 hours of battery life and a Liquid Retina display.",
    specs: [S.cpu("Apple M4"), S.ram("16 GB"), S.storage("256 GB SSD"), S.display('13,6" Liquid Retina'), S.weight("1,24 кг"), S.os("macOS")],
    variants: [
      { name: "16 GB / 256 GB · Midnight", options: { ram: "16 GB", storage: "256 GB" }, price: 14_990_000, stock: 10 },
      { name: "16 GB / 512 GB · Sky Blue", options: { ram: "16 GB", storage: "512 GB" }, price: 17_490_000, stock: 5 },
      { name: "24 GB / 512 GB · Silver", options: { ram: "24 GB", storage: "512 GB" }, price: 19_990_000, stock: 2 },
    ],
  },
  {
    slug: "apple-macbook-pro-14-m4-pro", name: 'Apple MacBook Pro 14" M4 Pro', brand: "apple", category: "laptops", isFeatured: true,
    images: [IMG.laptopPurple, IMG.laptopColor],
    ru: "Профессиональный ноутбук с чипом M4 Pro, экраном Liquid Retina XDR и портами Thunderbolt 5.",
    en: "Pro laptop with M4 Pro chip, Liquid Retina XDR display and Thunderbolt 5 ports.",
    specs: [S.cpu("Apple M4 Pro"), S.ram("24 GB"), S.storage("512 GB SSD"), S.display('14,2" Liquid Retina XDR'), S.os("macOS")],
    variants: [{ name: "24 GB / 512 GB · Space Black", options: { ram: "24 GB", storage: "512 GB" }, price: 27_490_000, stock: 3 }],
  },
  {
    slug: "lenovo-thinkpad-x1-carbon-gen-13", name: "Lenovo ThinkPad X1 Carbon Gen 13", brand: "lenovo", category: "laptops",
    images: [IMG.laptopWork, IMG.laptopOpen],
    ru: "Лёгкий бизнес-ультрабук весом около 1 кг с процессором Intel Core Ultra и легендарной клавиатурой ThinkPad.",
    en: "Lightweight ~1 kg business ultrabook with Intel Core Ultra and the legendary ThinkPad keyboard.",
    specs: [S.cpu("Intel Core Ultra 7"), S.ram("32 GB"), S.storage("1 TB SSD"), S.display('14" 2.8K OLED'), S.weight("0,99 кг"), S.os("Windows 11 Pro")],
    variants: [{ name: "Ultra 7 / 32 GB / 1 TB", options: { ram: "32 GB", storage: "1 TB" }, price: 26_990_000, compareAt: 28_900_000, stock: 2 }],
  },
  {
    slug: "asus-rog-zephyrus-g16", name: "ASUS ROG Zephyrus G16", brand: "asus", category: "laptops", isNew: true,
    images: [IMG.laptopColor, IMG.gamingSetup],
    ru: "Игровой ноутбук в алюминиевом корпусе с OLED-экраном 240 Гц и видеокартой GeForce RTX.",
    en: "Gaming laptop in an aluminium chassis with a 240 Hz OLED display and GeForce RTX graphics.",
    specs: [S.cpu("Intel Core Ultra 9"), S.gpu("NVIDIA GeForce RTX 5070 Ti"), S.ram("32 GB"), S.storage("1 TB SSD"), S.display('16" OLED 2.5K, 240 Гц'), S.os("Windows 11")],
    variants: [{ name: "RTX 5070 Ti / 32 GB / 1 TB", options: { ram: "32 GB", storage: "1 TB" }, price: 33_990_000, stock: 3 }],
  },
  {
    slug: "hp-pavilion-15", name: "HP Pavilion 15", brand: "hp", category: "laptops",
    images: [IMG.laptopOpen],
    ru: "Универсальный ноутбук для учёбы и работы с Full HD экраном и быстрым SSD.",
    en: "Versatile laptop for study and work with a Full HD screen and fast SSD.",
    specs: [S.cpu("Intel Core i5"), S.ram("16 GB"), S.storage("512 GB SSD"), S.display('15,6" Full HD IPS'), S.os("Windows 11")],
    variants: [
      { name: "i5 / 16 GB / 512 GB", options: { ram: "16 GB", storage: "512 GB" }, price: 8_290_000, compareAt: 8_990_000, stock: 11 },
      { name: "i7 / 16 GB / 1 TB", options: { ram: "16 GB", storage: "1 TB" }, price: 9_890_000, stock: 4 },
    ],
  },
  {
    slug: "dell-xps-13", name: "Dell XPS 13", brand: "dell", category: "laptops",
    images: [IMG.laptopDesk],
    ru: "Компактный премиальный ноутбук с безрамочным экраном InfinityEdge.",
    en: "Compact premium laptop with an InfinityEdge display.",
    specs: [S.cpu("Intel Core Ultra 7"), S.ram("16 GB"), S.storage("512 GB SSD"), S.display('13,4" FHD+'), S.os("Windows 11")],
    variants: [{ name: "Ultra 7 / 16 GB / 512 GB", options: { ram: "16 GB", storage: "512 GB" }, price: 17_490_000, stock: 4 }],
  },
  // ---------- Computers ----------
  {
    slug: "apple-imac-24-m4", name: 'Apple iMac 24" M4', brand: "apple", category: "computers", isNew: true,
    images: [IMG.aio, IMG.deskSetup],
    ru: "Моноблок iMac на чипе M4 с дисплеем 4,5K Retina и камерой Center Stage.",
    en: "iMac all-in-one with M4 chip, 4.5K Retina display and Center Stage camera.",
    specs: [S.cpu("Apple M4"), S.ram("16 GB"), S.storage("256 GB SSD"), S.display('24" 4.5K Retina'), S.os("macOS")],
    variants: [{ name: "M4 / 16 GB / 256 GB", options: { ram: "16 GB" }, price: 18_990_000, stock: 3 }],
  },
  {
    slug: "bayhan-gaming-pc-rtx-5070", name: "Игровой ПК BAYHAN Forge RTX 5070", brand: "nvidia", category: "computers", isFeatured: true,
    images: [IMG.pcCase, IMG.gamingSetup],
    ru: "Сборка для игр в 1440p: AMD Ryzen 7, GeForce RTX 5070, 32 ГБ DDR5 и NVMe-накопитель. Демонстрационная конфигурация.",
    en: "1440p gaming build: AMD Ryzen 7, GeForce RTX 5070, 32 GB DDR5 and NVMe storage. Demo configuration.",
    specs: [S.cpu("AMD Ryzen 7 9700X"), S.gpu("NVIDIA GeForce RTX 5070 12 GB"), S.ram("32 GB"), S.storage("1 TB NVMe"), S.power("750 Вт 80+ Gold")],
    variants: [{ name: "Ryzen 7 / RTX 5070 / 32 GB", options: { ram: "32 GB" }, price: 21_490_000, stock: 2 }],
  },
  {
    slug: "hp-all-in-one-24", name: "HP All-in-One 24", brand: "hp", category: "computers",
    images: [IMG.deskSetup],
    ru: "Моноблок для дома и офиса: экран Full HD, беспроводные клавиатура и мышь в комплекте.",
    en: "All-in-one for home and office: Full HD screen, wireless keyboard and mouse included.",
    specs: [S.cpu("Intel Core i5"), S.ram("16 GB"), S.storage("512 GB SSD"), S.display('23,8" Full HD'), S.os("Windows 11")],
    variants: [{ name: "i5 / 16 GB / 512 GB", options: { ram: "16 GB" }, price: 9_490_000, stock: 5 }],
  },
  // ---------- PC components ----------
  {
    slug: "nvidia-geforce-rtx-5080", name: "NVIDIA GeForce RTX 5080 16 GB", brand: "nvidia", category: "pc-components", isFeatured: true, isNew: true,
    images: [IMG.gpu],
    ru: "Видеокарта поколения Blackwell с DLSS 4 и 16 ГБ памяти GDDR7 для игр в 4K.",
    en: "Blackwell-generation graphics card with DLSS 4 and 16 GB GDDR7 for 4K gaming.",
    specs: [S.type("Видеокарта"), ["memory", "Видеопамять", "Video memory", "16 GB GDDR7"], S.power("360 Вт")],
    variants: [{ name: "16 GB GDDR7", price: 17_990_000, stock: 3 }],
  },
  {
    slug: "amd-ryzen-7-9800x3d", name: "AMD Ryzen 7 9800X3D", brand: "amd", category: "pc-components",
    images: [IMG.cpu],
    ru: "Игровой процессор с технологией 3D V-Cache: 8 ядер, 16 потоков, сокет AM5.",
    en: "Gaming CPU with 3D V-Cache: 8 cores, 16 threads, AM5 socket.",
    specs: [S.type("Процессор"), ["cores", "Ядра / потоки", "Cores / threads", "8 / 16"], ["socket", "Сокет", "Socket", "AM5"]],
    variants: [{ name: "BOX", price: 6_490_000, compareAt: 6_990_000, stock: 6 }],
  },
  {
    slug: "intel-core-ultra-7-265k", name: "Intel Core Ultra 7 265K", brand: "intel", category: "pc-components",
    images: [IMG.cpu],
    ru: "Настольный процессор Intel Core Ultra 200S: 20 ядер, разблокированный множитель.",
    en: "Intel Core Ultra 200S desktop CPU: 20 cores, unlocked multiplier.",
    specs: [S.type("Процессор"), ["cores", "Ядра / потоки", "Cores / threads", "20 / 20"], ["socket", "Сокет", "Socket", "LGA1851"]],
    variants: [{ name: "BOX", price: 4_890_000, stock: 5 }],
  },
  // ---------- Monitors & peripherals ----------
  {
    slug: "lg-ultragear-27-oled", name: 'LG UltraGear 27" OLED', brand: "lg", category: "monitors-peripherals", isNew: true,
    images: [IMG.gamingSetup, IMG.deskSetup],
    ru: "Игровой OLED-монитор QHD с частотой 240 Гц и временем отклика 0,03 мс.",
    en: "QHD gaming OLED monitor with 240 Hz refresh rate and 0.03 ms response time.",
    specs: [S.type("Монитор"), S.diagonal('27"'), S.resolution("2560×1440"), S.refresh("240 Гц")],
    variants: [{ name: '27" QHD 240 Гц', price: 9_990_000, compareAt: 11_490_000, stock: 4 }],
  },
  {
    slug: "samsung-odyssey-g5-32", name: 'Samsung Odyssey G5 32"', brand: "samsung", category: "monitors-peripherals",
    images: [IMG.deskSetup],
    ru: "Изогнутый игровой монитор 32\" с разрешением QHD и частотой 165 Гц.",
    en: "Curved 32\" QHD gaming monitor with 165 Hz refresh rate.",
    specs: [S.type("Монитор"), S.diagonal('32"'), S.resolution("2560×1440"), S.refresh("165 Гц")],
    variants: [{ name: '32" QHD 165 Гц', price: 4_590_000, stock: 7 }],
  },
  {
    slug: "logitech-mx-keys-s", name: "Logitech MX Keys S", brand: "logitech", category: "monitors-peripherals",
    images: [IMG.keyboard],
    ru: "Беспроводная клавиатура с подсветкой, работой с тремя устройствами и тихим ходом клавиш.",
    en: "Wireless backlit keyboard that pairs with three devices and has quiet keys.",
    specs: [S.type("Клавиатура"), S.connect("Bluetooth, Logi Bolt")],
    variants: [{ name: "Graphite", price: 1_490_000, stock: 14 }],
  },
  {
    slug: "logitech-mx-master-3s", name: "Logitech MX Master 3S", brand: "logitech", category: "monitors-peripherals",
    images: [IMG.mouse],
    ru: "Эргономичная мышь с тихими кликами, сенсором 8000 DPI и колесом MagSpeed.",
    en: "Ergonomic mouse with quiet clicks, 8000 DPI sensor and MagSpeed wheel.",
    specs: [S.type("Мышь"), S.connect("Bluetooth, Logi Bolt")],
    variants: [{ name: "Graphite", price: 1_290_000, stock: 18 }],
  },
  // ---------- Tablets ----------
  {
    slug: "apple-ipad-air-11-m3", name: 'Apple iPad Air 11" M3', brand: "apple", category: "tablets", isNew: true,
    images: [IMG.tabletDark, IMG.tabletHand],
    ru: "iPad Air на чипе M3 с поддержкой Apple Pencil Pro и клавиатуры Magic Keyboard.",
    en: "iPad Air with M3 chip, supporting Apple Pencil Pro and Magic Keyboard.",
    specs: [S.display('11" Liquid Retina'), S.cpu("Apple M3"), S.storage("128 GB"), S.os("iPadOS")],
    variants: [
      { name: "128 GB Wi-Fi · Space Gray", options: { storage: "128 GB" }, price: 8_490_000, stock: 8 },
      { name: "256 GB Wi-Fi · Blue", options: { storage: "256 GB" }, price: 9_790_000, stock: 4 },
    ],
  },
  {
    slug: "samsung-galaxy-tab-s10-fe", name: "Samsung Galaxy Tab S10 FE", brand: "samsung", category: "tablets",
    images: [IMG.tabletHand],
    ru: "Планшет с экраном 10,9\", пером S Pen в комплекте и защитой IP68.",
    en: "10.9\" tablet with S Pen included and IP68 protection.",
    specs: [S.display('10,9" LCD 90 Гц'), S.storage("128 GB"), S.os("Android")],
    variants: [{ name: "8/128 GB Wi-Fi", options: { storage: "128 GB" }, price: 5_290_000, compareAt: 5_890_000, stock: 9 }],
  },
  {
    slug: "xiaomi-pad-7", name: "Xiaomi Pad 7", brand: "xiaomi", category: "tablets",
    images: [IMG.tabletDark],
    ru: "Планшет с экраном 3.2K 144 Гц и процессором Snapdragon 7+ Gen 3.",
    en: "Tablet with a 3.2K 144 Hz display and Snapdragon 7+ Gen 3.",
    specs: [S.display('11,2" 3.2K, 144 Гц'), S.storage("256 GB"), S.os("Android")],
    variants: [{ name: "8/256 GB", options: { storage: "256 GB" }, price: 4_390_000, stock: 10 }],
  },
  // ---------- TV & Audio ----------
  {
    slug: "lg-oled-evo-c5-55", name: 'LG OLED evo C5 55"', brand: "lg", category: "tv-audio", isFeatured: true,
    images: [IMG.tv],
    ru: "OLED-телевизор 4K с процессором α9 AI, Dolby Vision и частотой 144 Гц для игр.",
    en: "4K OLED TV with α9 AI processor, Dolby Vision and 144 Hz for gaming.",
    specs: [S.type("Телевизор"), S.diagonal('55"'), S.resolution("3840×2160"), S.refresh("144 Гц")],
    variants: [
      { name: '55"', options: { size: '55"' }, price: 19_990_000, compareAt: 22_490_000, stock: 3 },
      { name: '65"', options: { size: '65"' }, price: 27_990_000, stock: 2 },
    ],
  },
  {
    slug: "samsung-crystal-uhd-50", name: 'Samsung Crystal UHD 50"', brand: "samsung", category: "tv-audio",
    images: [IMG.tv],
    ru: "4K-телевизор со Smart TV Tizen и процессором Crystal 4K.",
    en: "4K TV with Tizen Smart TV and Crystal 4K processor.",
    specs: [S.type("Телевизор"), S.diagonal('50"'), S.resolution("3840×2160"), S.refresh("60 Гц")],
    variants: [{ name: '50"', price: 5_490_000, stock: 6 }],
  },
  {
    slug: "sony-wh-1000xm6", name: "Sony WH-1000XM6", brand: "sony", category: "tv-audio", isNew: true, isFeatured: true,
    images: [IMG.headphonesWhite, IMG.headphonesWood],
    ru: "Беспроводные наушники с ведущим шумоподавлением и до 30 часов работы.",
    en: "Wireless headphones with leading noise cancelling and up to 30 hours of playback.",
    specs: [S.type("Наушники"), S.connect("Bluetooth 5.3"), S.battery("до 30 ч")],
    variants: [
      { name: "Black", options: { color: "Black" }, price: 5_290_000, stock: 8 },
      { name: "Platinum Silver", options: { color: "Platinum Silver" }, price: 5_290_000, stock: 5 },
    ],
  },
  {
    slug: "apple-airpods-pro-2", name: "Apple AirPods Pro 2", brand: "apple", category: "tv-audio",
    images: [IMG.earbuds],
    ru: "Наушники с активным шумоподавлением, адаптивным звуком и кейсом USB-C.",
    en: "Earbuds with active noise cancellation, Adaptive Audio and USB-C case.",
    specs: [S.type("Наушники"), S.connect("Bluetooth 5.3"), S.battery("до 6 ч (30 ч с кейсом)")],
    variants: [{ name: "USB-C", price: 3_190_000, compareAt: 3_490_000, stock: 16 }],
  },
  {
    slug: "jbl-charge-5", name: "JBL Charge 5", brand: "jbl", category: "tv-audio",
    images: [IMG.speaker],
    ru: "Портативная колонка с защитой IP67, мощным басом и функцией powerbank.",
    en: "Portable IP67 speaker with powerful bass and power bank function.",
    specs: [S.type("Колонка"), S.connect("Bluetooth 5.1"), S.battery("до 20 ч")],
    variants: [{ name: "Black", price: 1_890_000, stock: 12 }],
  },
  {
    slug: "sony-ult-field-1", name: "Sony ULT FIELD 1", brand: "sony", category: "tv-audio",
    images: [IMG.speakerShelf],
    ru: "Компактная колонка с режимом ULT для глубоких басов, защита IP67.",
    en: "Compact speaker with ULT mode for deep bass, IP67 protection.",
    specs: [S.type("Колонка"), S.connect("Bluetooth 5.3"), S.battery("до 12 ч")],
    variants: [{ name: "Black", price: 1_390_000, stock: 0 }],
  },
  // ---------- Home appliances ----------
  {
    slug: "samsung-ww90-washing-machine", name: "Samsung WW90 AI Ecobubble", brand: "samsung", category: "home-appliances", isFeatured: true,
    images: [IMG.washer],
    ru: "Стиральная машина на 9 кг с технологией Ecobubble, паровой обработкой и инверторным двигателем.",
    en: "9 kg washing machine with Ecobubble, steam care and an inverter motor.",
    specs: [S.type("Стиральная машина"), S.volume("9 кг"), S.energy("A"), ["spin", "Отжим", "Spin", "1400 об/мин"]],
    variants: [{ name: "9 кг", price: 7_990_000, compareAt: 8_690_000, stock: 4 }],
  },
  {
    slug: "lg-refrigerator-doorcooling", name: "LG DoorCooling+ GA-B509", brand: "lg", category: "home-appliances",
    images: [IMG.fridge],
    ru: "Двухкамерный холодильник No Frost с инверторным компрессором и технологией DoorCooling+.",
    en: "Two-door No Frost fridge with inverter compressor and DoorCooling+.",
    specs: [S.type("Холодильник"), S.volume("419 л"), S.energy("A+")],
    variants: [{ name: "Silver", price: 8_490_000, stock: 3 }],
  },
  {
    slug: "xiaomi-robot-vacuum-s20", name: "Xiaomi Robot Vacuum S20+", brand: "xiaomi", category: "home-appliances", isNew: true,
    images: [IMG.robotVacuum],
    ru: "Робот-пылесос с влажной уборкой, лидаром и самоочищающейся станцией.",
    en: "Robot vacuum with mopping, LiDAR navigation and self-cleaning dock.",
    specs: [S.type("Робот-пылесос"), ["suction", "Мощность всасывания", "Suction", "6000 Па"]],
    variants: [{ name: "White", price: 4_290_000, stock: 6 }],
  },
  {
    slug: "dyson-v15-detect", name: "Dyson V15 Detect", brand: "dyson", category: "home-appliances",
    images: [IMG.robotVacuum],
    ru: "Беспроводной пылесос с лазерной подсветкой пыли и пьезодатчиком частиц.",
    en: "Cordless vacuum with laser dust detection and piezo particle sensor.",
    specs: [S.type("Пылесос"), S.battery("до 60 мин"), S.power("230 АВт")],
    variants: [{ name: "Yellow/Nickel", price: 8_990_000, stock: 2 }],
  },
  {
    slug: "artel-air-conditioner-12", name: "Artel Shahrisabz 12 Inverter", brand: "artel", category: "home-appliances",
    images: [IMG.smartPhoneHome],
    ru: "Инверторный кондиционер для помещений до 35 м² с режимами охлаждения и обогрева.",
    en: "Inverter air conditioner for rooms up to 35 m² with cooling and heating.",
    specs: [S.type("Кондиционер"), S.power("12 000 BTU"), S.energy("A++")],
    variants: [{ name: "12 000 BTU", price: 4_790_000, stock: 8 }],
  },
  // ---------- Kitchen ----------
  {
    slug: "delonghi-magnifica-evo", name: "De'Longhi Magnifica Evo", brand: "delonghi", category: "kitchen", isFeatured: true,
    images: [IMG.coffee, IMG.kitchen],
    ru: "Автоматическая кофемашина с капучинатором LatteCrema и встроенной кофемолкой.",
    en: "Fully automatic coffee machine with LatteCrema milk system and built-in grinder.",
    specs: [S.type("Кофемашина"), S.power("1450 Вт"), S.volume("1,8 л")],
    variants: [{ name: "Black", price: 6_990_000, compareAt: 7_790_000, stock: 5 }],
  },
  {
    slug: "samsung-microwave-mg23", name: "Samsung MG23 Grill", brand: "samsung", category: "kitchen",
    images: [IMG.microwave],
    ru: "Микроволновая печь 23 л с грилем и керамической эмалью.",
    en: "23 L microwave with grill and ceramic enamel interior.",
    specs: [S.type("Микроволновая печь"), S.volume("23 л"), S.power("800 Вт")],
    variants: [{ name: "Black", price: 1_590_000, stock: 10 }],
  },
  {
    slug: "bosch-serie-6-oven", name: "Bosch Serie 6 HBA5", brand: "bosch", category: "kitchen",
    images: [IMG.oven, IMG.kitchen],
    ru: "Встраиваемый духовой шкаф с 3D-горячим воздухом и пиролитической очисткой.",
    en: "Built-in oven with 3D Hotair and pyrolytic cleaning.",
    specs: [S.type("Духовой шкаф"), S.volume("71 л"), S.energy("A")],
    variants: [{ name: "Stainless steel", price: 9_290_000, stock: 2 }],
  },
  {
    slug: "philips-airfryer-xxl", name: "Philips Airfryer XXL", brand: "philips", category: "kitchen", isNew: true,
    images: [IMG.kitchen],
    ru: "Аэрогриль на 7,3 л с технологией удаления жира и приложением рецептов.",
    en: "7.3 L air fryer with fat removal technology and recipe app.",
    specs: [S.type("Аэрогриль"), S.volume("7,3 л"), S.power("2000 Вт")],
    variants: [{ name: "Black", price: 3_490_000, stock: 7 }],
  },
  // ---------- Smart home & accessories ----------
  {
    slug: "apple-watch-series-10", name: "Apple Watch Series 10", brand: "apple", category: "smart-home", isNew: true,
    images: [IMG.watch, IMG.watchBlack],
    ru: "Самые тонкие Apple Watch с большим дисплеем, отслеживанием сна и здоровья.",
    en: "The thinnest Apple Watch with a larger display, sleep and health tracking.",
    specs: [S.type("Умные часы"), S.display("42/46 мм OLED"), S.battery("до 18 ч")],
    variants: [
      { name: "42 мм · Jet Black", options: { size: "42 mm" }, price: 5_290_000, stock: 6 },
      { name: "46 мм · Rose Gold", options: { size: "46 mm" }, price: 5_790_000, stock: 4 },
    ],
  },
  {
    slug: "xiaomi-smart-band-9", name: "Xiaomi Smart Band 9", brand: "xiaomi", category: "smart-home",
    images: [IMG.watchBlack],
    ru: "Фитнес-браслет с AMOLED-экраном, более 150 режимами тренировок и до 21 дня работы.",
    en: "Fitness band with AMOLED display, 150+ workout modes and up to 21 days of battery.",
    specs: [S.type("Фитнес-браслет"), S.battery("до 21 дня")],
    variants: [{ name: "Midnight Black", price: 490_000, compareAt: 590_000, stock: 30 }],
  },
  {
    slug: "philips-hue-starter-kit", name: "Philips Hue White & Color Starter Kit", brand: "philips", category: "smart-home",
    images: [IMG.smartPhoneHome],
    ru: "Стартовый набор умного освещения: 3 лампы E27 и мост Hue Bridge.",
    en: "Smart lighting starter kit: 3 E27 bulbs and Hue Bridge.",
    specs: [S.type("Умное освещение"), S.connect("Zigbee, Bluetooth")],
    variants: [{ name: "3 × E27 + Bridge", price: 2_490_000, stock: 5 }],
  },
  {
    slug: "anker-usb-c-charger-65w", name: "Anker 65W USB-C GaN Charger", brand: "anker", category: "smart-home",
    images: [IMG.accessories, IMG.techFlat],
    ru: "Компактное зарядное устройство GaN 65 Вт с двумя портами USB-C и одним USB-A.",
    en: "Compact 65 W GaN charger with two USB-C ports and one USB-A.",
    specs: [S.type("Зарядное устройство"), S.power("65 Вт")],
    variants: [{ name: "White", price: 390_000, stock: 40 }],
  },
];
