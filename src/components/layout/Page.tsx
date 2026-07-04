import type { HTMLAttributes, ReactNode } from "react";
import "./Page.css";

export type PageWidth = "default" | "narrow" | "wide";

export interface PageProps extends HTMLAttributes<HTMLElement> {
  width?: PageWidth;
}

export function Page({ width = "default", className, ...props }: PageProps) {
  return (
    <main
      className={["doka-page", `doka-page--${width}`, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header className={["doka-page-header", className].filter(Boolean).join(" ")} {...props}>
      <div className="doka-page-header__copy">
        {eyebrow ? <span className="doka-page-header__eyebrow">{eyebrow}</span> : null}
        <h1 className="doka-page-header__title">{title}</h1>
        {description ? <p className="doka-page-header__description">{description}</p> : null}
      </div>
      {actions ? <div className="doka-page-header__actions">{actions}</div> : null}
    </header>
  );
}
