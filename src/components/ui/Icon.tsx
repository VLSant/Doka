/**
 * Doka Icon primitive — line icons, 2px stroke, 24px grid, `currentColor`,
 * matching the Lucide-based system described in `design-system/readme.md`.
 * Only the glyphs needed by this feature's routes/UI are embedded; extend
 * `ICON_PATHS` as new modules require new icons.
 */
import type { SVGProps } from "react";

export type IconName =
  | "layout-dashboard"
  | "alert-triangle"
  | "list-checks"
  | "life-buoy"
  | "upload"
  | "wallet"
  | "database"
  | "history"
  | "log-out"
  | "user"
  | "building-2"
  | "chevron-right"
  | "eye"
  | "eye-off"
  | "alert-circle"
  | "check-circle"
  | "search"
  | "panel-left";

const ICON_PATHS: Record<IconName, string> = {
  "layout-dashboard": "M3 3h7v7H3zM14 3h7v4h-7zM14 11h7v10h-7zM3 14h7v7H3z",
  "alert-triangle":
    "M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01",
  "list-checks": "M3 6h5M3 12h5M3 18h5M14 6l1.5 1.5L19 4M14 18l1.5 1.5L19 16",
  "life-buoy":
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.93 4.93l3.54 3.54M15.53 15.53l3.54 3.54M19.07 4.93l-3.54 3.54M8.47 15.53l-3.54 3.54",
  upload: "M12 19V5M5 12l7-7 7 7M5 19h14",
  wallet: "M3 7h15a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2h12M16 14h.01",
  database:
    "M12 5c4.42 0 8-1.12 8-2.5S16.42 0 12 0 4 1.12 4 2.5 7.58 5 12 5ZM4 2.5V19.5C4 20.88 7.58 22 12 22s8-1.12 8-2.5V2.5M4 9.5c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5M4 15.5c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5",
  history: "M3 3v6h6M3 9a9 9 0 1 0 3-7M12 7v5l4 2",
  "log-out": "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  "building-2":
    "M6 22V8a1 1 0 0 1 1-1h4v15M14 22V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v17M3 22h18M9 13h0M9 17h0",
  "chevron-right": "M9 18l6-6-6-6",
  eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  "eye-off":
    "M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 4.22-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22",
  "alert-circle": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 8v5M12 16h.01",
  "check-circle": "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3",
  search: "M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z",
  "panel-left": "M3 3h18v18H3zM9 3v18M5.5 12h1",
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 20, ...rest }: IconProps) {
  const path = ICON_PATHS[name];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={path} />
    </svg>
  );
}
