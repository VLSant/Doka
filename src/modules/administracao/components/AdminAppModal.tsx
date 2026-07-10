import type { ReactNode } from "react";
import {
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalFooter,
  AppModalHeader,
  AppModalSubtitle,
  AppModalTitle,
} from "../../../components/shadcn/AppModal";

export function AdminAppModal({
  open,
  title,
  description,
  footer,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  footer: ReactNode;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <AppModal open={open} onOpenChange={(nextOpen) => (nextOpen ? undefined : onClose())}>
      <AppModalContent size="md">
        <AppModalHeader>
          <AppModalTitle>{title}</AppModalTitle>
          <AppModalSubtitle>{description}</AppModalSubtitle>
        </AppModalHeader>
        <AppModalBody>{children}</AppModalBody>
        <AppModalFooter>{footer}</AppModalFooter>
      </AppModalContent>
    </AppModal>
  );
}
