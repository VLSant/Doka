import "@testing-library/jest-dom/vitest";
import { createElement, type ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi } from "vitest";

// jsdom does not implement these APIs, but Radix UI primitives (Select,
// Popover, Dropdown, etc.) call them during pointer interactions. Without
// these no-op polyfills, userEvent.click on Radix triggers/items throws.
if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}

// jsdom does not implement ResizeObserver, but cmdk (used by the shadcn
// Command/GlobalSearchDialog) observes list size on mount.
if (typeof globalThis.ResizeObserver === "undefined") {
  class NoopResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = NoopResizeObserver;
}

vi.mock("@testing-library/react", async () => {
  const actual = await vi.importActual<typeof import("@testing-library/react")>(
    "@testing-library/react",
  );

  return {
    ...actual,
    render: (ui: ReactElement, options?: Parameters<typeof actual.render>[1]) => {
      const client = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      const wrapped = createElement(QueryClientProvider, { client }, ui);
      return actual.render(wrapped, options);
    },
  };
});
