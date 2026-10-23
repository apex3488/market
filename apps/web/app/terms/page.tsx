import { InfoPage, infoMeta } from "@/components/InfoPage";

export const generateMetadata = infoMeta("nav.terms");

export default function Page() {
  return <InfoPage title="nav.terms" body="page.terms.body" />;
}
