import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import type { ReactNode } from "react";
import { useState } from "react";

interface ImageModalProps {
  imageWithFallback: React.ReactNode;
  content: (onClose: () => void) => ReactNode;
}

export default function ImageModal({
  imageWithFallback,
  content,
}: ImageModalProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button">{imageWithFallback}</button>
      </DialogTrigger>
      <DialogContent className="p-0 bg-transparent border-none shadow-none rounded-none w-auto max-w-none">
        {content(() => setOpen(false))}
      </DialogContent>
    </Dialog>
  );
}
