import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--card)",
          border: "1px solid var(--border)",
          color: "var(--card-foreground)",
          fontFamily: "var(--font-sans)",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
