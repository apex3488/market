import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { PromoView } from "@market/data";
import { CallbackForm } from "./callback-form";

export function PasList({ promos }: { promos: PromoView[] }) {
  const [lead, ...rest] = promos;
  if (!lead) return null;

  return (
    <section className="grid gap-6 lg:grid-cols-12 lg:gap-5">
      <article className="relative overflow-hidden rounded-[var(--radius)] border border-line bg-surface lg:col-span-7 lg:min-h-[28rem]">
        <Image src={lead.image} alt="" fill sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
        <div className="relative z-[1] flex h-full min-h-[22rem] flex-col justify-end gap-3 p-6 md:p-8">
          <h2 className="max-w-[18ch] font-serif text-4xl leading-[1.05] text-balance md:text-5xl">{lead.problem}</h2>
          <p className="max-w-[34rem] text-muted">{lead.agitate}</p>
          <p className="max-w-[34rem]">{lead.solution}</p>
          <Link href={lead.href} className="btn w-fit">
            {lead.cta}
          </Link>
        </div>
      </article>

      <div className="grid gap-5 lg:col-span-5">
        {rest.map((promo) => (
          <article
            key={promo.id}
            className="grid gap-4 rounded-[var(--radius)] border border-line bg-surface p-5 sm:grid-cols-[7rem_1fr] sm:items-center"
          >
            <div className="relative aspect-square overflow-hidden rounded-[var(--radius-control)] bg-raised">
              <Image src={promo.image} alt="" fill sizes="112px" className="object-cover" />
            </div>
            <div className="grid gap-2">
              <h2 className="font-serif text-3xl leading-[1.05] text-balance">{promo.problem}</h2>
              <p className="text-sm text-muted">{promo.agitate}</p>
              <p className="text-sm">{promo.solution}</p>
              <Link href={promo.href} className="btn btn-ghost w-fit">
                {promo.cta}
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="rounded-[var(--radius)] border border-line bg-raised p-6 md:p-8 lg:col-span-12">
        <CallbackForm />
      </div>
    </section>
  );
}
