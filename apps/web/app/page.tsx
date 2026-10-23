import Link from "next/link";
import { formatPrice, img, type HomeResponse, type ProductCard as P } from "@bayhan/shared";
import { Icon } from "@/components/Icon";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { getT } from "@/lib/i18n-server";
import { serverGet } from "@/lib/server-api";

export default async function Home() {
  const { locale, t } = await getT();
  const data = await serverGet<HomeResponse>("/home", locale);
  if (!data) return null;
  const heroA = data.featured[0];
  const heroB = data.featured.find((p) => p.category.slug !== heroA?.category.slug) ?? data.featured[1];
  const total = data.categories.reduce((a, c) => a + (c.productCount ?? 0), 0);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow"><i /> {t("brand.slogan")}</span>
            <h1>
              {locale === "ru" ? (
                <>Технологии, которые <span className="accent">меняют каждый день.</span></>
              ) : (
                <>Technology that <span className="accent">transforms every day.</span></>
              )}
            </h1>
            <p className="lead">{t("hero.subtitle")}</p>
            <div className="hero-actions">
              <Link href="/catalog" className="btn btn-primary btn-lg">
                {t("hero.cta")} <Icon name="arrow" size={18} />
              </Link>
              <Link href="/compare" className="btn btn-ghost btn-lg">
                <Icon name="compare" size={18} /> {t("hero.cta2")}
              </Link>
            </div>
            <div className="hero-stats">
              <div><b>{total}+</b><span>{locale === "ru" ? "моделей в каталоге" : "models in catalog"}</span></div>
              <div><b>{data.categories.length}</b><span>{locale === "ru" ? "категорий" : "categories"}</span></div>
              <div><b>{data.brands.length}</b><span>{locale === "ru" ? "брендов" : "brands"}</span></div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="main">
              <img src={img("https://images.unsplash.com/photo-1593640408182-31c70c8268f5", 1100)} alt="" fetchPriority="high" />
            </div>
            {heroA && <FloatCard p={heroA} className="a" locale={locale} />}
            {heroB && <FloatCard p={heroB} className="b" locale={locale} />}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head">
              <h2>{t("home.categories")}</h2>
              <Link href="/catalog">{t("common.all")} <Icon name="chevron" size={16} /></Link>
            </div>
            <div className="cat-grid">
              {data.categories.map((c) => (
                <Link key={c.id} href={`/catalog/${c.slug}`} className="cat-card">
                  {c.imageUrl && <img src={img(c.imageUrl, 400)} alt="" loading="lazy" />}
                  <span className="ic" style={{ color: "var(--glow)", marginBottom: "auto" }}><Icon name={c.icon} size={24} /></span>
                  <b>{c.name}</b>
                  <span>{c.productCount}</span>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Shelf title={t("home.popular")} items={data.featured} href="/catalog?sort=popular" all={t("common.all")} />
      {data.deals.length > 0 && <Shelf title={t("home.deals")} items={data.deals} href="/catalog?tag=deals" all={t("common.all")} />}

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="pas">
              <h2>{locale === "ru" ? "Выбирать технику — проще, чем кажется" : "Choosing tech is easier than it looks"}</h2>
              <div className="pas-grid">
                <div className="pas-step"><b>01 · {locale === "ru" ? "ПРОБЛЕМА" : "PROBLEM"}</b><p>{t("pas.problem")}</p></div>
                <div className="pas-step"><b>02 · {locale === "ru" ? "РИСК" : "RISK"}</b><p className="muted">{t("pas.agitation")}</p></div>
                <div className="pas-step sol"><b>03 · {locale === "ru" ? "РЕШЕНИЕ" : "SOLUTION"}</b><p>{t("pas.solution")}</p></div>
              </div>
              <div className="row" style={{ marginTop: 28, flexWrap: "wrap" }}>
                <Link href="/catalog" className="btn btn-primary">{t("hero.cta")}</Link>
                <Link href="/compare" className="btn btn-ghost">{t("nav.compare")}</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <Shelf title={t("home.new")} items={data.newArrivals} href="/catalog?tag=new&sort=new" all={t("common.all")} />

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head"><h2>{t("home.why")}</h2></div>
            <div className="adv-grid">
              {([
                ["sparkle", "home.adv1.t", "home.adv1.d"],
                ["shield", "home.adv2.t", "home.adv2.d"],
                ["sync", "home.adv3.t", "home.adv3.d"],
                ["bell", "home.adv4.t", "home.adv4.d"],
              ] as const).map(([icon, a, b]) => (
                <div className="adv" key={a}>
                  <div className="ic"><Icon name={icon} size={22} /></div>
                  <h3>{t(a)}</h3>
                  <p>{t(b)}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-head"><h2>{t("home.brands")}</h2></div>
            <div className="brands-row">
              {data.brands.map((b) => (
                <Link key={b.id} href={`/catalog?brand=${b.slug}`} className="brand-tile">{b.name}</Link>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function Shelf({ title, items, href, all }: { title: string; items: P[]; href: string; all: string }) {
  if (!items.length) return null;
  return (
    <section className="section">
      <div className="container">
        <Reveal>
          <div className="section-head">
            <h2>{title}</h2>
            <Link href={href}>{all} <Icon name="chevron" size={16} /></Link>
          </div>
          <div className="scroller">
            {items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FloatCard({ p, className, locale }: { p: P; className: string; locale: "ru" | "en" }) {
  return (
    <Link href={`/product/${p.slug}`} className={`float-card ${className}`}>
      {p.image && <img src={img(p.image, 140)} alt="" />}
      <div>
        <b>{p.name}</b>
        <span>{formatPrice(p.price, p.currency, locale)}</span>
      </div>
    </Link>
  );
}
