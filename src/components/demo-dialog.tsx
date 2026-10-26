"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";

export function DemoDialog() {
  const t = useTranslations("demo");
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button type="button" className="btn btn-ghost" onClick={() => dialogRef.current?.showModal()}>
        {t("open")}
      </button>
      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="demo-title"
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
      >
        <div className="grid gap-4 p-6">
          <h2 id="demo-title" className="font-serif text-4xl leading-none text-balance">
            {t("title")}
          </h2>
          <p className="max-w-[38rem] text-muted">{t("text")}</p>
          <form method="dialog">
            <button type="submit" className="btn">
              {t("close")}
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
