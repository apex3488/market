import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { CategoryView } from "@market/data";

const areas = ["cell-hero", "cell-side", "cell-a", "cell-b", "cell-c", "cell-d"];

export function Bento({ categories }: { categories: CategoryView[] }) {
  return (
    <div className="bento-wrap">
      <div className="bento">
        {categories.slice(0, 6).map((category, index) => (
          <Link key={category.slug} href={`/c/${category.slug}`} className={areas[index]}>
            <Image src={category.image} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <span className="shade" aria-hidden="true" />
            <span className="label">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
