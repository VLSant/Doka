import type { HTMLAttributes, ReactNode } from "react";
import "./Patterns.css";

export function FilterBar(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["doka-filter-bar", props.className].filter(Boolean).join(" ")} />;
}

export function TableFrame(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["doka-table-frame", props.className].filter(Boolean).join(" ")} />;
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="doka-form-section">
      <header><h2>{title}</h2>{description ? <p>{description}</p> : null}</header>
      {children}
    </section>
  );
}

export function FormGrid(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["doka-form-grid", props.className].filter(Boolean).join(" ")} />;
}

export function MetricCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "brand" | "attention";
}) {
  return (
    <article className={`doka-metric-card doka-metric-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

export function DetailsPanel(props: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={["doka-details-panel", props.className].filter(Boolean).join(" ")} />;
}
