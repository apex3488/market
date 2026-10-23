import { InfoPage, infoMeta } from "@/components/InfoPage";

export const generateMetadata = infoMeta("nav.returns");

export default function Page() {
  return <InfoPage title="nav.returns" body="page.returns.body" />;
}
