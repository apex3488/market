import { InfoPage, infoMeta } from "@/components/InfoPage";

export const generateMetadata = infoMeta("nav.privacy");

export default function Page() {
  return <InfoPage title="nav.privacy" body="page.privacy.body" />;
}
