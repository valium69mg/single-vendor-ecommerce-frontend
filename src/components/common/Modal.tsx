import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { ReactNode } from "react";
import { useState } from "react";

interface ModalProps {
  buttonName: string;
  content: (onClose: () => void) => ReactNode;
}

export default function Modal({ buttonName, content }: ModalProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {buttonName}
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 bg-transparent border-none shadow-none rounded-none w-auto max-w-none">
        {content(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
