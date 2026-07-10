
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { XIcon } from "lucide-react";

import { cn } from "../../lib/utils";

import {
  Dialog,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogTrigger,
} from "./ui/dialog";

const modalVariants = cva(
  "relative grid w-full max-w-[calc(100%-2rem)] gap-4 rounded-xl border bg-background p-0 shadow-lg outline-none",
  {
    variants: {
      size: {
        xs: "sm:max-w-[400px]",
        sm: "sm:max-w-[560px]",
        md: "sm:max-w-[720px]",
        lg: "sm:max-w-[960px]",
      },
    },
    defaultVariants: {
      size: "sm",
    },
  },
);

interface AppModalContentProps
  extends React.ComponentProps<typeof DialogPrimitive.Content>,
    VariantProps<typeof modalVariants> {
  showCloseButton?: boolean;
}

function AppModalContent({
  className,
  children,
  size,
  showCloseButton = true,
  ...props
}: AppModalContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="app-modal-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
          "duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          modalVariants({ size }),
          className,
        )}
        {...props}
      >
        {/* Barra de autoridade Dracma — roxo profundo Doka */}
        <div className="absolute left-0 top-0 h-full w-2 rounded-bl-xl rounded-tl-xl bg-primary" />
        <div className="pl-2">{children}</div>
        {showCloseButton ? (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <XIcon className="size-4" />
            <span className="sr-only">Fechar</span>
          </DialogPrimitive.Close>
        ) : null}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function AppModalHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-modal-header"
      className={cn("flex flex-col gap-2 px-6 pb-4 pt-6 text-left", className)}
      {...props}
    />
  );
}

function AppModalTitle({
  className,
  children,
  icon,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title> & {
  icon?: React.ReactNode;
}) {
  return (
    <DialogPrimitive.Title
      data-slot="app-modal-title"
      className={cn(
        "flex items-center gap-3 text-[28px] font-bold text-foreground",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </DialogPrimitive.Title>
  );
}

function AppModalSubtitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="app-modal-subtitle"
      className={cn("text-[13px] text-muted-foreground", className)}
      {...props}
    />
  );
}

function AppModalBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-modal-body"
      className={cn("px-6", className)}
      {...props}
    />
  );
}

function AppModalFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-modal-footer"
      className={cn(
        "mt-6 flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog as AppModal,
  DialogClose as AppModalClose,
  AppModalContent,
  AppModalHeader,
  AppModalTitle,
  AppModalSubtitle,
  AppModalBody,
  AppModalFooter,
  DialogTrigger as AppModalTrigger,
};
