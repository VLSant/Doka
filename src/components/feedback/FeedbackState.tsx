/**
 * Reusable error/empty/neutral feedback state, used by access-denied,
 * configuration-unavailable, session-expired, not-found, temporary-failure,
 * and module-unavailable destinations (`route-navigation-contract.md`).
 */
import type { ReactNode } from "react";
import "./FeedbackState.css";

export type FeedbackTone = "neutral" | "error" | "empty";

export interface FeedbackStateProps {
  tone?: FeedbackTone;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function FeedbackState({ tone = "neutral", title, description, actions }: FeedbackStateProps) {
  return (
    <div className={`doka-feedback-state doka-feedback-state--${tone}`} role="status">
      <span className="doka-feedback-state__icon" aria-hidden="true">
        {tone === "error" ? "!" : tone === "empty" ? "○" : "i"}
      </span>
      <h2 className="doka-feedback-state__title">{title}</h2>
      {description && <p className="doka-feedback-state__description">{description}</p>}
      {actions && <div className="doka-feedback-state__actions">{actions}</div>}
    </div>
  );
}
