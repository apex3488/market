import { InfoPage, infoMeta } from "@/components/InfoPage";

export const generateMetadata = infoMeta("nav.delivery");

export default function Page() {
  return <InfoPage title="nav.delivery" body="page.delivery.body" />;
}
