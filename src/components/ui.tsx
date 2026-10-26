import type { ReactNode, SelectHTMLAttributes } from "react";
import { Link } from "@/i18n/navigation";

export function Button({
  href,
  children,
  variant = "solid",
  type = "button",
}: {
  href?: string;
  children: ReactNode;
  variant?: "solid" | "ghost";
  type?: "button" | "submit";
}) {
  const className = variant === "solid" ? "btn" : "btn btn-ghost";
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={className}>
      {children}
    </button>
  );
}

export function Input({
  label,
  id,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm text-muted">
      <span>{label}</span>
      <input id={id} className="field" {...props} />
    </label>
  );
}

export function Select({
  label,
  id,
  options,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  id: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm text-muted">
      <span>{label}</span>
      <select id={id} className="field" {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "no" }) {
  const toneClass = tone === "ok" ? "badge-ok" : tone === "no" ? "badge-no" : "";
  return <span className={`badge ${toneClass}`}>{children}</span>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}
