import type { ComponentType, HTMLAttributes, ReactNode } from "react";
import type { LucideProps } from "lucide-react";
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
  detail,
  tone = "neutral",
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: "neutral" | "brand" | "attention";
  icon?: ComponentType<LucideProps>;
}) {
  return (
    <article className={`doka-metric-card doka-metric-card--${tone}`}>
      <span className="doka-metric-card__label">{label}</span>
      <strong className="doka-metric-card__value">
        {Icon ? <Icon className="doka-metric-card__icon" aria-hidden="true" /> : null}
        {value}
      </strong>
      {detail ? <small className="doka-metric-card__detail">{detail}</small> : null}
    </article>
  );
}

export function DetailsPanel(props: HTMLAttributes<HTMLElement>) {
  return <section {...props} className={["doka-details-panel", props.className].filter(Boolean).join(" ")} />;
}
