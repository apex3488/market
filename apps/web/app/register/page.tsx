import type { Metadata } from "next";
import { Suspense } from "react";
import { RegisterForm } from "@/components/AuthForms";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("auth.register"), robots: { index: false } };
}

export default function Page() {
  return (
    <div className="container auth-wrap">
      <Suspense>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
