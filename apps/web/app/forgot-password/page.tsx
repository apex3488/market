import type { Metadata } from "next";
import { Suspense } from "react";
import { ForgotForm } from "@/components/AuthForms";
import { getT } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("auth.forgotTitle"), robots: { index: false } };
}

export default function Page() {
  return (
    <div className="container auth-wrap">
      <Suspense>
        <ForgotForm />
      </Suspense>
    </div>
  );
}
