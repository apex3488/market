import { InfoPage, infoMeta } from "@/components/InfoPage";

export const generateMetadata = infoMeta("nav.contacts");

export default function Page() {
  return <InfoPage title="nav.contacts" body="page.contacts.body" />;
}
