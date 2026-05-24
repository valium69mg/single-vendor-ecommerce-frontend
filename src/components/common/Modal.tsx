import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useState } from "react";

interface ModalProps {
  buttonName: string;
  content: (onClose: () => void) => ReactNode;
  size?: "sm" | "default" | "lg";
  triggerClassName?: string;
}

export default function Modal({ buttonName, content, size = "sm", triggerClassName }: ModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn("rounded-none", triggerClassName)}
        >
          {buttonName}
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 bg-transparent border-none shadow-none rounded-none w-auto max-w-none">
        {content(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
