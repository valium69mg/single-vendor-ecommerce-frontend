import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ReactNode } from "react";
interface ModalProps {
  buttonName: string;
  content: ReactNode;
}

export default function Modal({ buttonName, content }: ModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {buttonName}
        </Button>
      </DialogTrigger>
      <DialogContent>
        {content}
      </DialogContent>
    </Dialog>
  );
}
